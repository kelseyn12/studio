"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { dropCards } from "@/lib/drop-cards";
import { deleteUpload } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { sweepStale } from "@/lib/sweep";

export async function deleteSelectedVideos(formData: FormData) {
  const user = await requireUser();
  if (user.role === "EDITOR") redirect("/edits");
  const batchId = String(formData.get("batchId") || "");
  await dropCards(formData.getAll("cardId").map(String));
  revalidatePath("/library");
  revalidatePath("/plan");
  revalidatePath("/calendar");
  revalidatePath("/edits");
  revalidatePath("/");
  if (batchId) revalidatePath(`/repurposer/${batchId}`);
}

export async function deleteAsset(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) return;
  await deleteUpload(asset.path);
  await prisma.asset.delete({ where: { id } });
  revalidatePath("/library");
  revalidatePath(`/cards/${asset.cardId}`);
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
