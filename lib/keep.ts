/** Posted videos keep their files this long so a failed Outstand post can still be re-shipped. */
export const KEEP_FILE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isStalePosted(
  card: { status: string; postedAt: Date | null; updatedAt: Date },
  now: Date,
): boolean {
  if (card.status !== "POSTED" && card.status !== "DATA") return false;
  const stamp = card.postedAt ?? card.updatedAt;
  return now.getTime() - stamp.getTime() >= KEEP_FILE_DAYS * DAY_MS;
}

/** Once an editor cut exists, Multiply's generated looks are dead weight — the cut ships everywhere. */
export function supersededGeneratedIds(assets: Array<{ id: string; kind: string }>): string[] {
  if (!assets.some((asset) => asset.kind === "EDITED")) return [];
  return assets.filter((asset) => asset.kind === "GENERATED").map((asset) => asset.id);
}

export function staleFinishedIds(
  card: { status: string; postedAt: Date | null; updatedAt: Date },
  assets: Array<{ id: string; kind: string }>,
  now: Date,
): string[] {
  if (!isStalePosted(card, now)) return [];
  return assets.filter((asset) => asset.kind === "GENERATED" || asset.kind === "EDITED").map((asset) => asset.id);
}

/** Source clips can go once every video from the batch has posted and aged out. */
export function batchClipsAreStale(
  outputs: Array<{ card: { status: string; postedAt: Date | null; updatedAt: Date } | null }>,
  now: Date,
): boolean {
  if (outputs.length === 0) return false;
  return outputs.every((output) => output.card !== null && isStalePosted(output.card, now));
}
