"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { alreadyWithEditor, isDeskStage, keepInToCut, nextStatusFor, sendBackStatus, type DeskStage } from "@/lib/card-desk";
import { cardPatch } from "@/lib/card-patch";
import { approvalLine, changePreview, splitChangeNote, withApproval, withChangeNote } from "@/lib/change-note";
import { dropCards } from "@/lib/drop-cards";
import { beginCutting, attachEditedSaved } from "@/lib/cut-ready";
import { attachDriveLink } from "@/lib/drive-finished";
import { mimeFromName, saveStreamedFile } from "@/lib/files";
import { directMediaUrl, driveLinkKind } from "@/lib/media-url";
import { rejectStudioFile, STUDIO_FILE_MAX_BYTES } from "@/lib/storage";
import type { PipelineStatus } from "@/lib/pipeline";
import { prisma } from "@/lib/prisma";
import { pingStudio } from "@/lib/manychat";
import { timeAlreadyPassed } from "@/lib/dates";
import { ALREADY_SCHEDULED, postCaption, queueCard, waitingPostIds } from "@/lib/publish";
import { updatePostContent } from "@/lib/outstand";

async function saveCard(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  await prisma.card.update({ where: { id }, data: cardPatch(formData) });
  revalidatePath(`/cards/${id}`);
  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/edits");
  revalidatePath("/campaigns");
  return id;
}

export async function updateCard(formData: FormData) {
  const id = await saveCard(formData);
  const step = String(formData.get("step") || "");
  if (isDeskStage(step)) redirect(`/cards/${id}?step=${step}`);
}

export async function sendFootageToEditor(formData: FormData) {
  formData.set("cutBy", "EDITOR");
  await finishStage("footage", formData);
}

export async function keepCutting(formData: FormData) {
  formData.set("cutBy", "SELF");
  await finishStage("footage", formData);
}

export async function finishStage(stage: DeskStage, formData: FormData) {
  const id = String(formData.get("id"));
  const before = id
    ? await prisma.card.findUnique({ where: { id }, select: { status: true, cutBy: true, editorId: true } })
    : null;
  await saveCard(formData);
  const card = await prisma.card.findUnique({ where: { id } });
  const cutBy = String(formData.get("cutBy") || card?.cutBy || "SELF");
  const handingOff = cutBy === "EDITOR" && (stage === "footage" || stage === "editor");
  const next = card ? nextStatusFor(stage, card.status) : null;
  const kept = handingOff ? keepInToCut(next) : next;
  const patch: { status?: PipelineStatus; editorId?: string } = {};
  if (kept) patch.status = kept;
  if (stage === "editor" && card && !card.editorId && cutBy !== "SELF") {
    const fallback = await prisma.user.findFirst({ where: { defaultEditor: true, role: "EDITOR" } });
    if (fallback) patch.editorId = fallback.id;
  }
  if (stage === "footage" && cutBy === "EDITOR") {
    const chosen =
      String(formData.get("editorId") || "") ||
      (
        await prisma.user.findFirst({ where: { defaultEditor: true, role: "EDITOR" } })
      )?.id;
    if (chosen) patch.editorId = chosen;
  }
  if (Object.keys(patch).length) {
    await prisma.card.update({ where: { id }, data: patch });
  }
  revalidatePath(`/cards/${id}`);
  revalidatePath("/edits");
  const chosenEditor = String(patch.editorId || card?.editorId || "");
  const sent = handingOff && Boolean(chosenEditor);
  if (sent) {
    if (!alreadyWithEditor(before, chosenEditor)) {
      try {
        await pingStudio("editor", `New job: ${card?.title || "a video"}. It is under To cut.`);
      } catch {
        /* ManyChat must not block the handoff */
      }
    }
    redirect("/edits");
  }
  const onward = stage === "brief" ? "footage" : "editor";
  redirect(`/cards/${id}?step=${onward}`);
}


export async function requestChanges(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const card = await prisma.card.findUnique({ where: { id } });
  const next = card ? sendBackStatus(card.status) : null;
  if (!id || !next) redirect(id ? `/cards/${id}?step=live` : "/");
  const note = String(formData.get("editorNote") || "").trim();
  const editorNote = withChangeNote(card?.editorNote || "", note);
  await prisma.card.update({
    where: { id },
    data: { status: next, editorNote },
  });
  const fix = splitChangeNote(editorNote).fix;
  try {
    await pingStudio("editor", `Changes: ${card?.title || "a video"}. ${changePreview(fix) || "Open the job."} Open Cuts.`);
  } catch {
    /* the job is still back in Cutting */
  }
  revalidatePath(`/cards/${id}`);
  revalidatePath("/edits");
  revalidatePath("/");
  redirect("/edits");
}

export async function approveCut(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const card = await prisma.card.findUnique({ where: { id }, include: { assets: true } });
  const hasFile = card?.assets.some((asset) => asset.kind === "EDITED" || asset.kind === "GENERATED");
  if (!id || !hasFile || !card) redirect(id ? `/cards/${id}?step=live` : "/");
  const note = String(formData.get("note") || "").trim();
  await prisma.card.update({
    where: { id },
    data: { status: "READY", editorNote: withApproval(card.editorNote, note) },
  });
  if (card.cutBy === "EDITOR") {
    try {
      await pingStudio("editor", approvalLine(card.title, note));
    } catch {
      /* the video is still approved */
    }
  }
  revalidatePath(`/cards/${id}`);
  revalidatePath("/edits");
  revalidatePath("/library");
  revalidatePath("/");
  redirect(`/cards/${id}?step=live`);
}

export async function sendForTouchUp(formData: FormData) {
  const user = await requireUser();
  if (user.role === "EDITOR") redirect("/edits");
  const id = String(formData.get("id"));
  const card = await prisma.card.findUnique({ where: { id }, include: { assets: true } });
  if (!card || !card.assets.some((asset) => asset.kind === "EDITED" || asset.kind === "GENERATED")) {
    redirect(id ? `/cards/${id}?step=live` : "/");
  }
  const editorId =
    String(formData.get("editorId") || "") ||
    (await prisma.user.findFirst({ where: { defaultEditor: true, role: "EDITOR" } }))?.id;
  if (!editorId) redirect(`/cards/${id}?step=live&polish=no-editor`);
  const note = String(formData.get("editorNote") || "").trim();
  await prisma.card.update({
    where: { id },
    data: { status: "EDITING", cutBy: "EDITOR", editorId, editorNote: withChangeNote(card.editorNote, note) },
  });
  try {
    await pingStudio("editor", `Polish job: ${card.title}. Open Cuts.`);
  } catch {
    /* a missed ping still leaves the job on Cuts */
  }
  revalidatePath(`/cards/${id}`);
  revalidatePath("/edits");
  revalidatePath("/calendar");
  revalidatePath("/");
  redirect("/edits");
}

export async function togglePaid(formData: FormData) {
  const user = await requireUser();
  if (user.role === "EDITOR") return;
  const id = String(formData.get("id"));
  const card = await prisma.card.findUnique({ where: { id } });
  if (!card) return;
  await prisma.card.update({ where: { id }, data: { approved: !card.approved } });
  revalidatePath(`/cards/${id}`);
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath("/campaigns");
  revalidatePath("/");
}

export async function scheduleCard(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const when = formData.get("scheduledAt") ? new Date(String(formData.get("scheduledAt"))) : new Date();
  if (timeAlreadyPassed(when)) redirect("/calendar?ship=past");
  const accountIds = formData.getAll("accountIds").map(String).filter(Boolean);
  const accountId = accountIds[0] || String(formData.get("accountId") || "") || null;
  if (formData.has("caption")) {
    await prisma.card.update({
      where: { id },
      data: {
        caption: String(formData.get("caption") || ""),
        ...(accountIds.length ? { accountIds: accountIds.join(","), accountId } : {}),
      },
    });
  }
  const result = await queueCard(id, when, accountIds.length ? accountIds : accountId);
  if (!result.ok && result.error === ALREADY_SCHEDULED) {
    revalidatePath(`/cards/${id}`);
    redirect("/calendar?ship=taken");
  }
  revalidatePath(`/cards/${id}`);
  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath("/analytics");
  redirect(result.ok ? "/calendar?ship=ok" : "/calendar?ship=fail");
}

export async function updateScheduledCaption(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const caption = postCaption(String(formData.get("caption") || ""));
  const card = await prisma.card.findUnique({
    where: { id },
    include: { publishes: { select: { status: true, outstandPostId: true } } },
  });
  if (!card?.scheduledAt) redirect(`/cards/${id}`);
  await prisma.card.update({ where: { id }, data: { caption } });
  const postIds = waitingPostIds(card.publishes);
  let updated = 0;
  for (const postId of postIds) {
    try {
      await updatePostContent(postId, caption);
      updated += 1;
    } catch {
      /* already published, or Outstand refused — the saved caption still stays on the video */
    }
  }
  revalidatePath(`/cards/${id}`);
  revalidatePath("/calendar");
  redirect(updated > 0 ? "/calendar?ship=caption" : "/calendar?ship=caption-late");
}

export async function startCutting(formData: FormData) {
  const user = await requireUser();
  const cardId = String(formData.get("id") || "");
  if (!cardId) return;
  const started = await beginCutting(cardId, user);
  if (!started) return;
  revalidatePath("/edits");
  revalidatePath(`/cards/${cardId}`);
  redirect(`/cards/${cardId}?step=editor`);
}

export async function attachEditedUrl(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const raw = String(formData.get("editedUrl") || "");
  const style = String(formData.get("textStyle") || "");
  const textStyle = style === "instagram" || style === "tiktok" || style === "plain" ? style : "plain";
  if (id && driveLinkKind(raw)) {
    const saved = await attachDriveLink(id, raw, textStyle, user.role);
    if (!saved) redirect(`/cards/${id}?step=editor&link=no`);
    revalidatePath(`/cards/${id}`);
    revalidatePath("/edits");
    redirect(`/cards/${id}?step=live`);
  }
  const url = directMediaUrl(raw);
  if (!id || !url) {
    redirect(id ? `/cards/${id}?step=editor&link=no` : "/");
  }
  const response = await fetch(url);
  const typeHeader = response.headers.get("content-type") || "";
  if (!response.ok || typeHeader.includes("text/html") || !response.body) {
    redirect(`/cards/${id}?step=editor&link=no`);
  }
  const length = Number(response.headers.get("content-length") || 0);
  if (length > 0 && rejectStudioFile(length, "EDITED")) redirect(`/cards/${id}?step=editor&link=no`);
  const rawName = url.split("?")[0].split("/").pop() || "export.mp4";
  const name = rawName.includes(".") ? rawName : "export.mp4";
  const saved = await saveStreamedFile(response.body, `cards/${id}`, name, typeHeader || mimeFromName(name), STUDIO_FILE_MAX_BYTES);
  if (!saved) redirect(`/cards/${id}?step=editor&link=no`);
  await attachEditedSaved(id, saved, textStyle, user.role);
  revalidatePath(`/cards/${id}`);
  revalidatePath("/edits");
  redirect(`/cards/${id}?step=live`);
}

export async function deleteVideo(formData: FormData) {
  const user = await requireUser();
  if (user.role === "EDITOR") redirect("/edits");
  const id = String(formData.get("id") || "");
  if (!id) redirect("/plan");
  await dropCards([id]);
  revalidatePath("/plan");
  revalidatePath("/calendar");
  revalidatePath("/edits");
  revalidatePath("/library");
  revalidatePath("/");
  const next = String(formData.get("next") || "");
  redirect(next === "/edits" || next === "/library" ? next : "/plan");
}
