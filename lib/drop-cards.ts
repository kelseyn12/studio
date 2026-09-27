import { deleteUpload } from "@/lib/files";
import { prisma } from "@/lib/prisma";

export function uniqueIds(values: Iterable<string>): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const value of values) {
    const id = value.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

async function dropCardRow(cardId: string): Promise<void> {
  const card = await prisma.card.findUnique({ where: { id: cardId }, include: { assets: true } });
  if (!card) return;
  for (const asset of card.assets) {
    await deleteUpload(asset.path);
    if (asset.coverPath) await deleteUpload(asset.coverPath);
  }
  await prisma.publishJob.deleteMany({ where: { cardId } });
  await prisma.asset.deleteMany({ where: { cardId } });
  await prisma.repurposeOut.deleteMany({ where: { cardId } });
  await prisma.card.delete({ where: { id: cardId } });
}

/** Deletes videos and their files. Multiply output rows that point at them go too. */
export async function dropCards(ids: Iterable<string>): Promise<number> {
  let dropped = 0;
  for (const id of uniqueIds(ids)) {
    const card = await prisma.card.findUnique({ where: { id } });
    if (!card) continue;
    await dropCardRow(id);
    dropped += 1;
  }
  return dropped;
}

/** Deletes one finished Multiply file. The other look on the same video stays. */
export async function dropOutputs(ids: Iterable<string>): Promise<number> {
  let dropped = 0;
  for (const id of uniqueIds(ids)) {
    const output = await prisma.repurposeOut.findUnique({ where: { id } });
    if (!output) continue;
    await deleteUpload(output.path);
    await deleteUpload(`thumbs/${output.path}.jpg`);
    if (output.cardId) {
      const assets = await prisma.asset.findMany({ where: { cardId: output.cardId, path: output.path } });
      for (const asset of assets) {
        if (asset.coverPath) await deleteUpload(asset.coverPath);
        await prisma.asset.delete({ where: { id: asset.id } });
      }
    }
    await prisma.repurposeOut.delete({ where: { id } });
    if (output.cardId) {
      const left = await prisma.asset.count({ where: { cardId: output.cardId } });
      if (left === 0) await dropCardRow(output.cardId);
    }
    dropped += 1;
  }
  return dropped;
}
