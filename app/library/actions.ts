"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { dropCards, dropOutputs } from "@/lib/drop-cards";
import { deleteUpload } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { sweepStale } from "@/lib/sweep";
import { withVoiceTranscript } from "@/lib/voice-note";

export async function deleteSelectedVideos(formData: FormData) {
  const user = await requireUser();
  if (user.role === "EDITOR") redirect("/edits");
  const batchId = String(formData.get("batchId") || "");
  const outputIds = formData.getAll("outputId").map(String);
  if (outputIds.length) await dropOutputs(outputIds);
  else await dropCards(formData.getAll("cardId").map(String));
  revalidatePath("/library");
  revalidatePath("/plan");
  revalidatePath("/calendar");
  revalidatePath("/edits");
  revalidatePath("/");
  if (batchId) redirect(`/repurposer/${batchId}`);
  redirect("/library");
}

export async function deleteAsset(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "");
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) return;
  if (asset.kind === "VOICE" && user.role === "EDITOR") return;
  const voicesLeft =
    asset.kind === "VOICE"
      ? await prisma.asset.count({ where: { cardId: asset.cardId, kind: "VOICE", id: { not: asset.id } } })
      : 1;
  await deleteUpload(asset.path);
  await prisma.asset.delete({ where: { id } });
  if (asset.kind === "VOICE" && voicesLeft === 0) {
    const card = await prisma.card.findUnique({ where: { id: asset.cardId } });
    if (card) {
      await prisma.card.update({
        where: { id: card.id },
        data: { editorNote: withVoiceTranscript(card.editorNote, "") },
      });
    }
  }
  revalidatePath("/library");
  revalidatePath(`/cards/${asset.cardId}`);
  revalidatePath("/edits");
  revalidatePath("/");
}

export async function deletePostedRaws() {
  await requireUser();
  const assets = await prisma.asset.findMany({
    where: {
      kind: "RAW",
      card: { status: { in: ["POSTED", "DATA"] } },
    },
  });
  for (const asset of assets) {
    await deleteUpload(asset.path);
    await prisma.asset.delete({ where: { id: asset.id } });
  }
  revalidatePath("/library");
  revalidatePath("/");
}

/** Drop posted files older than 14 days and unused Multiply clips. Cards and numbers stay. */
export async function freeSpace() {
  await requireUser();
  await sweepStale();
  revalidatePath("/library");
  revalidatePath("/");
}
