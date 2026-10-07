const FIX_LINE = /^Fix:\s*([\s\S]*?)(?:\n\n|$)/;

/** What she asked him to change, and the brief he started from. */
export function splitChangeNote(note: string): { fix: string; brief: string } {
  const match = note.match(FIX_LINE);
  if (!match) return { fix: "", brief: note.trim() };
  return { fix: match[1].trim(), brief: note.slice(match[0].length).trim() };
}

/** A new Fix note sits on top. The brief, words, and voice transcript stay under it. */
export function withChangeNote(existing: string, fix: string): string {
  const asked = fix.trim();
  const { brief } = splitChangeNote(existing);
  if (!asked) return brief;
  return brief ? `Fix: ${asked}\n\n${brief}` : `Fix: ${asked}`;
}
