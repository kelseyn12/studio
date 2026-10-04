export type WaitingFolderCard = {
  id: string;
  title: string;
  hook: string;
  batch: string;
  deal: string;
};

export type WaitingFolder<T extends WaitingFolderCard> = {
  key: string;
  title: string;
  cards: Array<T & { mixLabel: string }>;
};

const FILE_NAME = /copy_|[0-9a-f]{8}-[0-9a-f]{4}-|\.(mp4|mov|m4v)$/i;

function titleParts(title: string): string[] {
  return title.split("·").map((part) => part.trim()).filter(Boolean);
}

/** The Multiply name you typed. A loose video uses the deal. */
export function waitingFolderName(card: { title: string; batch: string; deal: string }): string {
  const batch = card.batch.trim();
  if (batch) return batch;
  const parts = titleParts(card.title);
  const mixAt = parts.findIndex((part) => /^mix\s+\d+$/i.test(part));
  if (mixAt > 0) return parts.slice(0, mixAt).join(" · ");
  const deal = card.deal.trim();
  if (deal) return deal;
  return "Other videos";
}

/** Mix 2, plus the hook words when those words are not a file name. */
export function waitingMixLabel(title: string, hook: string): string {
  const mix = titleParts(title).find((part) => /^mix\s+\d+$/i.test(part));
  const mixLabel = mix ? `Mix ${mix.replace(/^mix\s+/i, "")}` : "";
  const words = hook.trim();
  if (words && !FILE_NAME.test(words)) return mixLabel ? `${mixLabel} · ${words}` : words;
  return mixLabel || title;
}

function mixNumber(title: string): number {
  const match = title.match(/mix\s+(\d+)/i);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

/** One closed folder per batch, mixes in number order inside it. */
export function groupWaitingFolders<T extends WaitingFolderCard>(cards: T[]): WaitingFolder<T>[] {
  const groups = new Map<string, WaitingFolder<T>>();
  for (const card of cards) {
    const title = waitingFolderName(card);
    const key = title.toLowerCase();
    const group = groups.get(key) ?? { key, title, cards: [] };
    group.cards.push({ ...card, mixLabel: waitingMixLabel(card.title, card.hook) });
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      cards: [...group.cards].sort(
        (left, right) => mixNumber(left.title) - mixNumber(right.title) || left.title.localeCompare(right.title),
      ),
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}
