"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { saveUpload } from "@/lib/files";
import { isPipelineStatus } from "@/lib/pipeline";
import { prisma } from "@/lib/prisma";
import { queueCard } from "@/lib/publish";

export async function updateCard(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  await prisma.card.update({
    where: { id },
    data: {
      title: String(formData.get("title") || "Untitled"),
      status: isPipelineStatus(status) ? status : undefined,
      campaignId: String(formData.get("campaignId") || "") || null,
      formatId: String(formData.get("formatId") || "") || null,
      accountId: String(formData.get("accountId") || "") || null,
      editorId: String(formData.get("editorId") || "") || null,
      premise: String(formData.get("premise") || ""),
      hook: String(formData.get("hook") || ""),
      body: String(formData.get("body") || ""),
      plug: String(formData.get("plug") || ""),
      script: String(formData.get("script") || ""),
      caption: String(formData.get("caption") || ""),
      referenceUrl: String(formData.get("referenceUrl") || ""),
      editorNote: String(formData.get("editorNote") || ""),
      captionStyle: String(formData.get("captionStyle") || ""),
      plannedDate: formData.get("plannedDate") ? new Date(String(formData.get("plannedDate"))) : null,
      scheduledAt: formData.get("scheduledAt") ? new Date(String(formData.get("scheduledAt"))) : null,
      deadlineAt: formData.get("deadlineAt") ? new Date(String(formData.get("deadlineAt"))) : null,
      payoutCents: Math.round(Number(formData.get("payout") || 0) * 100),
      views: Number(formData.get("views") || 0),
      likes: Number(formData.get("likes") || 0),
      comments: Number(formData.get("comments") || 0),
      approved: formData.get("approved") === "on",
    },
  });
  revalidatePath(`/cards/${id}`);
  revalidatePath("/");
  revalidatePath("/pipeline");
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
  await queueCard(id, when, accountId);
  revalidatePath(`/cards/${id}`);
  revalidatePath("/calendar");
}
