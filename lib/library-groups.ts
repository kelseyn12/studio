import type { PipelineStatus } from "@/lib/pipeline";

/** Ready videos that already have a day should not keep reading as "To schedule". */
export function libraryMark(status: PipelineStatus, scheduledAt: Date | null): string | undefined {
  if (status === "READY" && scheduledAt) return "Scheduled";
  return undefined;
}

/** The gold link under a finished file. Scheduled videos open; they are not waiting to be scheduled. */
export function libraryAction(status: PipelineStatus, scheduledAt: Date | null): string {
  if (status === "REVIEW") return "Approve / schedule";
  if (status === "READY" && !scheduledAt) return "Schedule";
  return "Open";
}

export function groupByDeal<T extends { card: { campaign: { name: string } | null } }>(
  items: T[],
): Array<{ deal: string; items: T[] }> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const deal = item.card.campaign?.name?.trim() || "No deal";
    const list = map.get(deal) ?? [];
    list.push(item);
    map.set(deal, list);
  }
  return [...map.entries()]
    .sort(([left], [right]) => {
      if (left === "No deal") return 1;
      if (right === "No deal") return -1;
      return left.localeCompare(right);
    })
    .map(([deal, grouped]) => ({ deal, items: grouped }));
}
