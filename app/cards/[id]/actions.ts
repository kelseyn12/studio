"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { nextStatusFor, type DeskStage } from "@/lib/card-desk";
import { cardPatch } from "@/lib/card-patch";
import { saveUpload, mimeFromName } from "@/lib/files";
import { isDirectMediaUrl } from "@/lib/media-url";
import { isPipelineStatus, type PipelineStatus } from "@/lib/pipeline";
import { prisma } from "@/lib/prisma";
import { pingStudio } from "@/lib/manychat";
import { queueCard } from "@/lib/publish";

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
      await pingStudio("editor", `New job: ${card?.title || "a video"}. Open CapCut in.`);
    } catch {
      /* ManyChat must not block the handoff */
    }
    redirect("/edits");
  }
  const onward = stage === "brief" ? "footage" : "editor";
  redirect(`/cards/${id}?step=${onward}`);
}

export async function uploadAsset(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const kind = String(formData.get("kind") || "RAW") as "RAW" | "VOICE" | "EDITED" | "REFERENCE";
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;
  const saved = await saveUpload(file, `cards/${id}`);
  await prisma.asset.create({
    data: { cardId: id, kind, ...saved },
  });
  if (kind === "EDITED") {
    await prisma.card.update({ where: { id }, data: { status: "REVIEW" } });
  } else if (kind === "RAW" || kind === "VOICE") {
    const card = await prisma.card.findUnique({ where: { id } });
    if (card && (card.status === "IDEA" || card.status === "SCRIPTED")) {
      await prisma.card.update({ where: { id }, data: { status: "FILMED" } });
    }
  }
  revalidatePath(`/cards/${id}`);
  revalidatePath("/edits");
  revalidatePath("/library");
}

export async function advanceCard(id: string, status: string) {
  await requireUser();
  if (!isPipelineStatus(status)) return;
  const data: { status: typeof status; postedAt?: Date } = { status };
  if (status === "POSTED") data.postedAt = new Date();
  await prisma.card.update({ where: { id }, data });
  revalidatePath(`/cards/${id}`);
  redirect(`/cards/${id}`);
}

export async function scheduleCard(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const when = formData.get("scheduledAt") ? new Date(String(formData.get("scheduledAt"))) : new Date();
  const accountId = String(formData.get("accountId") || "") || null;
  if (formData.has("caption")) {
    await prisma.card.update({
      where: { id },
      data: { caption: String(formData.get("caption") || "") },
    });
  }
  const result = await queueCard(id, when, accountId);
  try {
    await pingStudio("creator", `Parked on Live: ${id}`);
  } catch {
    /* optional ping */
  }
  revalidatePath(`/cards/${id}`);
  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath("/analytics");
  redirect(result.ok ? "/calendar?ship=ok" : "/calendar?ship=fail");
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
  const bytes = Buffer.from(await response.arrayBuffer());
  const name = url.split("?")[0].split("/").pop() || "export.mp4";
  const type = response.headers.get("content-type") || mimeFromName(name);
  const saved = await saveUpload(new File([new Uint8Array(bytes)], name, { type }), `cards/${id}`);
  await prisma.asset.create({
    data: { cardId: id, kind: "EDITED", ...saved, publicUrl: saved.publicUrl || url },
  });
  await prisma.card.update({ where: { id }, data: { status: "REVIEW" } });
  revalidatePath(`/cards/${id}`);
  revalidatePath("/edits");
  redirect(`/cards/${id}?step=live`);
}
