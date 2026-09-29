/** One video per day up front, so seven days do not all start on the same mix. */
export function initialDayPicks(isoDays: string[], waitingIds: string[]): Record<string, string> {
  const picks: Record<string, string> = {};
  isoDays.forEach((day, index) => {
    const id = waitingIds[index];
    if (id) picks[day] = id;
  });
  return picks;
}

/** Card ids already chosen on a different day. Those options stay visible but cannot be picked. */
export function takenOnOtherDays(picks: Record<string, string>, isoDay: string): Set<string> {
  return new Set(
    Object.entries(picks)
      .filter(([day, id]) => day !== isoDay && id)
      .map(([, id]) => id),
  );
}

/**
 * Point this day at a video and move any other day off it onto the next video that is still free.
 */
export function chooseDay(
  picks: Record<string, string>,
  day: string,
  cardId: string,
  isoDays: string[],
  waitingIds: string[],
): Record<string, string> {
  const next: Record<string, string> = { ...picks, [day]: cardId };
  for (const other of Object.keys(next)) {
    if (other !== day && next[other] === cardId) delete next[other];
  }
  const used = new Set(Object.values(next));
  for (const iso of isoDays) {
    if (next[iso]) continue;
    const free = waitingIds.find((id) => !used.has(id));
    if (!free) break;
    next[iso] = free;
    used.add(free);
  }
  return next;
}
