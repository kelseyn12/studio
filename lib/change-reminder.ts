export const FIRST_REMIND_MS = 4 * 60 * 60 * 1000;
export const NEXT_REMIND_MS = 24 * 60 * 60 * 1000;

/** A missed Discord ping gets one nudge after 4 hours, then once a day, until he drops the new video. */
export function reminderDue(updatedAt: Date, now: Date, lastRemindedAt: Date | null): boolean {
  if (now.getTime() - updatedAt.getTime() < FIRST_REMIND_MS) return false;
  if (!lastRemindedAt) return true;
  return now.getTime() - lastRemindedAt.getTime() >= NEXT_REMIND_MS;
}
