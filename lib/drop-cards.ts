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

/** Deletes videos and their files. Multiply output rows that point at them go too. */
export async function dropCards(ids: Iterable<string>): Promise<number> {
  let dropped = 0;
  for (const id of uniqueIds(ids)) {
    const card = await prisma.card.findUnique({ where: { id }, include: { assets: true } });
    if (!card) continue;
    for (const asset of card.assets) {
      await deleteUpload(asset.path);
    }
    await prisma.repurposeOut.deleteMany({ where: { cardId: id } });
    await prisma.card.delete({ where: { id } });
    dropped += 1;
  }
  return dropped;
}
