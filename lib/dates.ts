export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function startOfWeek(date: Date): Date {
  const next = startOfDay(date);
  const day = next.getDay();
  next.setDate(next.getDate() - day);
  return next;
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function monthGrid(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function weekGrid(anchor: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(anchor), index));
}

export function sameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function labelDay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const SLOT_MINUTES = [10 * 60, 15 * 60, 18 * 60];

function clockLabel(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Minutes from midnight. The first three stay 10:00, 3:00, and 6:00. Later videos step forward an hour. */
export function slotMinutes(already: number): number {
  const index = Math.max(0, already);
  if (index < SLOT_MINUTES.length) return SLOT_MINUTES[index];
  const extra = index - (SLOT_MINUTES.length - 1);
  return Math.min(23 * 60 + 45, SLOT_MINUTES[SLOT_MINUTES.length - 1] + extra * 60);
}

/** Next open clock time on a day that already has `already` videos. Never repeats the last time. */
export function nextSlotTime(already: number): string {
  return clockLabel(slotMinutes(already));
}

export function clockOnDay(day: Date, clock: string): Date {
  const [hour, minute] = clock.split(":").map(Number);
  const when = startOfDay(day);
  when.setHours(hour || 0, minute || 0, 0, 0);
  return when;
}

/**
 * A clock still ahead of now. A day that already ended has none.
 * Today skips 10:00 once that hour has passed, and a later video never shares the previous clock.
 */
export function openSlotTime(day: Date, already: number, now = new Date()): string | null {
  if (startOfDay(day).getTime() < startOfDay(now).getTime()) return null;
  const futureDay = startOfDay(day).getTime() > startOfDay(now).getTime();
  for (let index = Math.max(0, already); index < 16; index += 1) {
    const clock = nextSlotTime(index);
    if (futureDay || clockOnDay(day, clock).getTime() > now.getTime() + 60_000) return clock;
  }
  return null;
}

/** Outstand posts a past time immediately. Refuse it. */
export function timeAlreadyPassed(when: Date, now = new Date()): boolean {
  return Number.isNaN(when.getTime()) || when.getTime() <= now.getTime() + 60_000;
}

export function labelTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** "Mon, Sep 28 · 10:00 AM" — the scheduled list has no day column, so the date has to be on the row. */
export function labelWhen(date: Date): string {
  const day = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return `${day} · ${labelTime(date)}`;
}

export function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toInputDateTime(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return startOfDay(new Date());
  return new Date(year, month - 1, day);
}

export function labelWeekRange(start: Date): string {
  const end = addDays(start, 6);
  const left = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const right = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${left} – ${right}`;
}
