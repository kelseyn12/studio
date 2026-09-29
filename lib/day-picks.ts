/** Point this day at a video. If another day was aimed at it, that day goes back to "Pick a video". */
export function chooseDay(picks: Record<string, string>, day: string, cardId: string): Record<string, string> {
  const next: Record<string, string> = { ...picks, [day]: cardId };
  for (const other of Object.keys(next)) {
    if (other !== day && next[other] === cardId) delete next[other];
  }
  return next;
}
