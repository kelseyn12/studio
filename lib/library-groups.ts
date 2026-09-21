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
