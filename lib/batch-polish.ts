/**
 * Which Multiply outputs can still go to the editor for a polish pass:
 * built, not yet scheduled, and not already sitting in the editor's queue.
 */
export type PolishCandidate = { id: string; status: string; scheduledAt: Date | null };

export function cardsToPolish(cards: PolishCandidate[]): string[] {
  return cards.filter((card) => card.status === "READY" && !card.scheduledAt).map((card) => card.id);
}

export function polishNote(batchName: string, note: string): string {
  const trimmed = note.trim();
  return trimmed ? `${trimmed} (Multiply batch: ${batchName})` : `Polish pass on Multiply batch: ${batchName}`;
}
