"use client";

import { parkCard } from "@/app/calendar/actions";
import { ScheduleButton } from "@/components/schedule-button";
import { useDayPicks } from "@/components/day-picks";

export function DaySlot({
  isoDay,
  waiting,
}: {
  isoDay: string;
  waiting: Array<{ id: string; title: string }>;
}) {
  const picks = useDayPicks();
  if (waiting.length === 0) return null;
  const taken = picks?.taken(isoDay) ?? new Set<string>();
  const value = picks?.value(isoDay) || waiting.find((card) => !taken.has(card.id))?.id || "";
  return (
    <form action={parkCard} className="mt-3 space-y-2">
      <select
        name="cardId"
        className="field text-xs"
        required
        value={value}
        onChange={(event) => picks?.choose(isoDay, event.target.value)}
      >
        {waiting.map((card) => {
          const held = taken.has(card.id);
          return (
            <option key={card.id} value={card.id} disabled={held}>
              {held ? `${card.title} · already on a day` : card.title}
            </option>
          );
        })}
      </select>
      <input name="scheduledAt" type="datetime-local" defaultValue={`${isoDay}T10:00`} className="field text-xs" required />
      <ScheduleButton
        label="Schedule here"
        className="w-full rounded-lg bg-sun px-2 py-1.5 text-xs font-semibold text-ink"
      />
      <p className="text-[11px] text-mute">A video already chosen on another day is greyed out.</p>
    </form>
  );
}
