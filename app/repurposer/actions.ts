"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { cardsToPolish, polishNote } from "@/lib/batch-polish";
import { pingStudio } from "@/lib/manychat";
import { prisma } from "@/lib/prisma";

export async function createBatch(formData: FormData) {
  await requireUser();
  const batch = await prisma.repurposeBatch.create({
    data: { name: String(formData.get("name") || "New batch") },
  });
  redirect(`/repurposer/${batch.id}`);
}

export async function resetBatch(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  await prisma.repurposeBatch.update({ where: { id }, data: { status: "draft" } });
  redirect(`/repurposer/${id}`);
}

/** Send every built, unscheduled video in a batch to the editor's Cuts queue in one go. */
export async function sendBatchToEditor(formData: FormData) {
  const user = await requireUser();
  if (user.role === "EDITOR") redirect("/edits");
  const id = String(formData.get("id"));
  const batch = await prisma.repurposeBatch.findUnique({ where: { id }, include: { outputs: true } });
  if (!batch) redirect("/repurposer");
  const editorId =
    String(formData.get("editorId") || "") ||
    (await prisma.user.findFirst({ where: { defaultEditor: true, role: "EDITOR" } }))?.id ||
    (await prisma.user.findFirst({ where: { role: "EDITOR" } }))?.id;
  if (!editorId) redirect(`/repurposer/${id}?polish=no-editor`);
  const cardIds = batch.outputs.map((output) => output.cardId).filter((cardId): cardId is string => Boolean(cardId));
  const cards = await prisma.card.findMany({
    where: { id: { in: cardIds } },
    select: { id: true, status: true, scheduledAt: true },
  });
  const toSend = cardsToPolish(cards);
  if (toSend.length === 0) redirect(`/repurposer/${id}?polish=none`);
  await prisma.card.updateMany({
    where: { id: { in: toSend } },
    data: { status: "EDITING", cutBy: "EDITOR", editorId, editorNote: polishNote(batch.name, String(formData.get("editorNote") || "")) },
  });
  try {
    await pingStudio("editor", `${toSend.length} polish jobs from ${batch.name}. Open Cuts.`);
  } catch {
    /* optional ping */
  }
  revalidatePath("/edits");
  revalidatePath("/pipeline");
  revalidatePath("/calendar");
  revalidatePath("/");
  redirect(`/repurposer/${id}?polish=${toSend.length}`);
}
