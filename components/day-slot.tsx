"use client";

import { parkCard } from "@/app/calendar/actions";
import { ScheduleButton } from "@/components/schedule-button";
import { useDayPicks } from "@/components/day-picks";

export function DaySlot({
  isoDay,
  waiting,
  scheduled,
}: {
  isoDay: string;
  waiting: Array<{ id: string; title: string }>;
  scheduled: Array<{ id: string; title: string }>;
}) {
  const picks = useDayPicks();
  if (waiting.length === 0 && scheduled.length === 0) return null;
  const value = picks?.value(isoDay) || "";
  return (
    <form action={parkCard} className="mt-3 space-y-2">
      <select
        name="cardId"
        className="field text-xs"
        required
        value={value}
        onChange={(event) => picks?.choose(isoDay, event.target.value)}
      >
        <option value="">Pick a video</option>
        {waiting.map((card) => (
          <option key={card.id} value={card.id}>
            {card.title}
          </option>
        ))}
        {scheduled.map((card) => (
          <option key={card.id} value={card.id} disabled>
            {card.title} · already scheduled
          </option>
        ))}
      </select>
      <input name="scheduledAt" type="datetime-local" defaultValue={`${isoDay}T10:00`} className="field text-xs" required />
      <ScheduleButton
        label="Schedule here"
        className="w-full rounded-lg bg-sun px-2 py-1.5 text-xs font-semibold text-ink"
      />
      <p className="text-[11px] text-mute">Any mix that is not on the calendar yet. Grey ones are already scheduled.</p>
    </form>
  );
}
