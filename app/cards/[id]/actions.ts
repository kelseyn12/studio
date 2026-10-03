"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { nextStatusFor, sendBackStatus, type DeskStage } from "@/lib/card-desk";
import { cardPatch } from "@/lib/card-patch";
import { dropCards } from "@/lib/drop-cards";
import { deleteUpload, saveUpload, mimeFromName } from "@/lib/files";
import { isDirectMediaUrl } from "@/lib/media-url";
import { rejectStudioFile } from "@/lib/storage";
import type { PipelineStatus } from "@/lib/pipeline";
import { prisma } from "@/lib/prisma";
import { markCutReady } from "@/lib/cut-ready";
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
  await saveCard(formData);
}

export async function finishStage(stage: DeskStage, formData: FormData) {
  const id = await saveCard(formData);
  const card = await prisma.card.findUnique({ where: { id } });
  const next = card ? nextStatusFor(stage, card.status) : null;
  const patch: { status?: PipelineStatus; editorId?: string } = {};
  if (next) patch.status = next;
  const cutBy = String(formData.get("cutBy") || card?.cutBy || "SELF");
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
    if (chosen) {
      patch.status = "EDITING";
      patch.editorId = chosen;
    }
  }
  if (Object.keys(patch).length) {
    await prisma.card.update({ where: { id }, data: patch });
  }
  revalidatePath(`/cards/${id}`);
  revalidatePath("/edits");
  const sent = stage === "editor" || (stage === "footage" && cutBy === "EDITOR" && patch.status === "EDITING");
  if (sent && cutBy !== "SELF") {
    try {
      await pingStudio("editor", `New job: ${card?.title || "a video"}. Open Cuts in Studio.`);
    } catch {
      /* ManyChat must not block the handoff */
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
  await prisma.card.update({
    where: { id },
    data: { status: next, editorNote: note || card?.editorNote || "" },
  });
  try {
    await pingStudio("editor", `Changes on ${card?.title || "a video"}. Open Cuts.`);
  } catch {
    /* optional ping */
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
  if (!id || !hasFile) redirect(id ? `/cards/${id}?step=live` : "/");
  await prisma.card.update({ where: { id }, data: { status: "READY" } });
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
    data: { status: "EDITING", cutBy: "EDITOR", editorId, editorNote: note || card.editorNote },
  });
  try {
    await pingStudio("editor", `Polish job: ${card.title}. Open Cuts.`);
  } catch {
    /* optional ping */
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
  try {
    await pingStudio("creator", `Scheduled: ${id}`);
  } catch {
    /* optional ping */
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

export async function attachEditedUrl(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const url = String(formData.get("editedUrl") || "").trim();
  if (!id || !isDirectMediaUrl(url)) {
    redirect(id ? `/cards/${id}?step=editor` : "/");
  }
  const response = await fetch(url);
  if (!response.ok) redirect(`/cards/${id}?step=editor`);
  const length = Number(response.headers.get("content-length") || 0);
  if (length > 0 && rejectStudioFile(length, "EDITED")) redirect(`/cards/${id}?step=editor`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (rejectStudioFile(bytes.length, "EDITED")) redirect(`/cards/${id}?step=editor`);
  const name = url.split("?")[0].split("/").pop() || "export.mp4";
  const type = response.headers.get("content-type") || mimeFromName(name);
  const saved = await saveUpload(new File([new Uint8Array(bytes)], name, { type }), `cards/${id}`);
  const style = String(formData.get("textStyle") || "");
  const textStyle = style === "instagram" || style === "tiktok" || style === "plain" ? style : "plain";
  await prisma.asset.create({
    data: { cardId: id, kind: "EDITED", ...saved, publicUrl: saved.publicUrl || url, textStyle },
  });
  await markCutReady(id);
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
