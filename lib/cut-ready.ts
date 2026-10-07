import { pingForFinishedDrop, priorEditedIds, shouldStartCutting, statusAfterDrop } from "@/lib/card-desk";
import { deleteUpload, saveUpload } from "@/lib/files";
import { pingStudio } from "@/lib/manychat";
import { prisma } from "@/lib/prisma";
import { dropSuperseded } from "@/lib/sweep";

/** To cut → Cutting. Only the assigned editor, and only before he has started. */
export async function beginCutting(cardId: string, user: { id: string; role: string }): Promise<boolean> {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { status: true, cutBy: true, editorId: true },
  });
  if (!shouldStartCutting(card, user)) return false;
  await prisma.card.update({ where: { id: cardId }, data: { status: "EDITING" } });
  return true;
}

/** One video replaces the old file. A second look replaces only that look. */
export async function replaceEditedLook(cardId: string, textStyle: string, keepId: string): Promise<void> {
  const assets = await prisma.asset.findMany({
    where: { cardId, kind: "EDITED" },
    select: { id: true, kind: true, textStyle: true, path: true, coverPath: true },
  });
  const drop = new Set(priorEditedIds(assets, textStyle, keepId));
  for (const asset of assets) {
    if (!drop.has(asset.id)) continue;
    await deleteUpload(asset.path);
    if (asset.coverPath) await deleteUpload(asset.coverPath);
    await prisma.asset.delete({ where: { id: asset.id } });
  }
}

/** Stores a finished video on its card. Her own cut is ready to schedule. His cut waits for her. */
export async function attachEditedFile(cardId: string, file: File, textStyle: string, uploaderRole: string): Promise<void> {
  const saved = await saveUpload(file, `cards/${cardId}`);
  const created = await prisma.asset.create({ data: { cardId, kind: "EDITED", ...saved, textStyle } });
  await replaceEditedLook(cardId, textStyle, created.id);
  await markCutReady(cardId, uploaderRole);
}

export async function markCutReady(id: string, uploaderRole: string): Promise<void> {
  const existing = await prisma.card.findUnique({ where: { id }, select: { status: true, cutBy: true, title: true } });
  if (!existing) return;
  await dropSuperseded(id);
  const next = statusAfterDrop(existing.cutBy, existing.status);
  if (!next) return;
  const card = await prisma.card.update({ where: { id }, data: { status: next } });
  if (!pingForFinishedDrop(uploaderRole, card.cutBy)) return;
  try {
    await pingStudio("creator", `Ready to watch: ${card.title}. Open Cuts.`);
  } catch {
    /* Today and Cuts still show To approve */
  }
}
