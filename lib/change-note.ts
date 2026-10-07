const FIX_LINE = /^Fix:\s*([\s\S]*?)(?:\n\n|$)/;

/** What she asked him to change, and the brief he started from. */
export function splitChangeNote(note: string): { fix: string; brief: string } {
  const match = note.match(FIX_LINE);
  if (!match) return { fix: "", brief: note.trim() };
  return { fix: match[1].trim(), brief: note.slice(match[0].length).trim() };
}

/** A job he already cut, sent back because she asked for a fix. */
export function needsChanges(status: string, note: string): boolean {
  return status === "EDITING" && Boolean(splitChangeNote(note).fix);
}

/** The first line of a fix, short enough for Discord and the Cuts list. */
export function changePreview(fix: string, limit = 140): string {
  const line = fix.split(/\r?\n/).map((row) => row.trim()).find(Boolean) || "";
  if (line.length <= limit) return line;
  return `${line.slice(0, limit - 1)}…`;
}

/** Discord line when she approves. A blank note still tells him he is done. */
export function approvalLine(title: string, note: string): string {
  const name = title.trim() || "a video";
  const praise = changePreview(note, 240);
  return praise ? `Approved: ${name}. ${praise}` : `Approved: ${name}. You are done.`;
}

/** Approve clears the fix. Her note stays under the brief. */
export function withApproval(existing: string, note: string): string {
  const { brief } = splitChangeNote(existing);
  const praise = note.trim();
  if (!praise) return brief;
  return brief ? `${brief}\n\nApproved: ${praise}` : `Approved: ${praise}`;
}

/** A new Fix note sits on top. The brief, words, and voice transcript stay under it. */
export function withChangeNote(existing: string, fix: string): string {
  const asked = fix.trim();
  const { brief } = splitChangeNote(existing);
  if (!asked) return brief;
  return brief ? `Fix: ${asked}\n\n${brief}` : `Fix: ${asked}`;
}
