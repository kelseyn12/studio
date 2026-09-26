import { deleteUpload } from "@/lib/files";
import { batchClipsAreStale, staleFinishedIds, supersededGeneratedIds } from "@/lib/keep";
import { prisma } from "@/lib/prisma";

export type SweepResult = { files: number; clips: number };

async function dropAssetRows(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const assets = await prisma.asset.findMany({ where: { id: { in: ids } } });
  for (const asset of assets) {
    await deleteUpload(asset.path);
    await prisma.asset.delete({ where: { id: asset.id } });
  }
  return assets.length;
}

/** Drop Multiply looks that an editor cut just replaced. */
export async function dropSuperseded(cardId: string): Promise<number> {
  const assets = await prisma.asset.findMany({ where: { cardId }, select: { id: true, kind: true } });
  return dropAssetRows(supersededGeneratedIds(assets));
}

/**
 * Frees working files that are no longer needed: posted videos older than 14 days,
 * and Multiply source clips whose every output has aged out. Cards and numbers stay.
 */
export async function sweepStale(now = new Date()): Promise<SweepResult> {
  const cards = await prisma.card.findMany({
    where: { status: { in: ["POSTED", "DATA"] } },
    include: { assets: { select: { id: true, kind: true } } },
  });
  let files = 0;
  for (const card of cards) {
    files += await dropAssetRows(staleFinishedIds(card, card.assets, now));
  }
  const batches = await prisma.repurposeBatch.findMany({
    where: { status: "ready" },
    include: { clips: true, tracks: true, outputs: true },
  });
  let clips = 0;
  for (const batch of batches) {
    const cardIds = batch.outputs.map((output) => output.cardId).filter((id): id is string => Boolean(id));
    const cardsForBatch = await prisma.card.findMany({
      where: { id: { in: cardIds } },
      select: { id: true, status: true, postedAt: true, updatedAt: true },
    });
    const byId = new Map(cardsForBatch.map((card) => [card.id, card]));
    const outputs = batch.outputs.map((output) => ({ card: output.cardId ? byId.get(output.cardId) ?? null : null }));
    if (!batchClipsAreStale(outputs, now)) continue;
    for (const clip of batch.clips) {
      await deleteUpload(clip.path);
      if (clip.thumbPath) await deleteUpload(clip.thumbPath);
      await prisma.repurposeClip.delete({ where: { id: clip.id } });
      clips += 1;
    }
    for (const track of batch.tracks) {
      await deleteUpload(track.path);
      await prisma.repurposeTrack.delete({ where: { id: track.id } });
    }
  }
  return { files, clips };
}
