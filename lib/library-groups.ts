import { pillLabel, type PipelineStatus } from "@/lib/pipeline";

/** Ready videos that already have a day should not keep reading as "To schedule". */
export function libraryMark(status: PipelineStatus, scheduledAt: Date | null): string | undefined {
  if (status === "READY" && scheduledAt) return pillLabel(status, scheduledAt);
  return undefined;
}

/** The gold link under a finished file. Scheduled videos open; they are not waiting to be scheduled. */
export function libraryAction(status: PipelineStatus, scheduledAt: Date | null): string {
  if (status === "REVIEW") return "Approve / schedule";
  if (status === "READY" && !scheduledAt) return "Schedule";
  return "Open";
}

export type LibraryFolder<T> = { key: string; title: string; still: T[]; posted: T[] };

function isPosted(status: string): boolean {
  return status === "POSTED" || status === "DATA";
}

/** Batch videos stay together. Everything else stays under the deal. Posted files split out so the rest is what's left. */
export function groupLibrary<
  T extends { batch?: string; card: { status: string; campaign: { name: string } | null } },
>(items: T[]): LibraryFolder<T>[] {
  const batches = new Map<string, T[]>();
  const loose: T[] = [];
  for (const item of items) {
    const batch = item.batch?.trim();
    if (batch) {
      const list = batches.get(batch) ?? [];
      list.push(item);
      batches.set(batch, list);
    } else {
      loose.push(item);
    }
  }
  const folders = [...batches.entries()].map(([name, grouped]) => splitFolder(`batch:${name}`, name, grouped));
  for (const group of groupByDeal(loose)) folders.push(splitFolder(`deal:${group.deal}`, group.deal, group.items));
  return folders;
}

export function folderCount(still: number, posted: number): string {
  if (still > 0 && posted > 0) return `${still} still to do · ${posted} posted`;
  if (posted > 0) return `${posted} posted`;
  return `${still} still to do`;
}

function splitFolder<T extends { card: { status: string } }>(key: string, title: string, items: T[]): LibraryFolder<T> {
  return {
    key,
    title,
    still: items.filter((item) => !isPosted(item.card.status)),
    posted: items.filter((item) => isPosted(item.card.status)),
  };
}

export function groupByDeal<T extends { card: { campaign: { name: string } | null } }>(
  items: T[],
): Array<{ deal: string; items: T[] }> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const deal = item.card.campaign?.name?.trim() || "Personal";
    const list = map.get(deal) ?? [];
    list.push(item);
    map.set(deal, list);
  }
  return [...map.entries()]
    .sort(([left], [right]) => {
      if (left === "Personal") return 1;
      if (right === "Personal") return -1;
      return left.localeCompare(right);
    })
    .map(([deal, grouped]) => ({ deal, items: grouped }));
}
