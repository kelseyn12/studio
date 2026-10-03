"use client";

import { useState } from "react";
import { parkCard } from "@/app/calendar/actions";
import { ScheduleButton } from "@/components/schedule-button";
import { useDayPicks } from "@/components/day-picks";
import { openSlotTime, parseLocalDate } from "@/lib/dates";

export function DaySlot({
  isoDay,
  waiting,
  scheduled,
  taken = 0,
}: {
  isoDay: string;
  waiting: Array<{ id: string; title: string }>;
  scheduled: Array<{ id: string; title: string }>;
  taken?: number;
}) {
  const [round, setRound] = useState(0);
  if (waiting.length === 0 && scheduled.length === 0) return null;
  const day = parseLocalDate(isoDay);
  const first = openSlotTime(day, taken);
  if (!first) {
    if (waiting.length === 0) return null;
    return <p className="mt-3 text-[11px] text-mute">This day already happened.</p>;
  }
  return (
    <>
      {Array.from({ length: round + 1 }, (_, index) => {
        const time = openSlotTime(day, taken + index);
        if (!time) return null;
        return (
          <SlotForm
            key={time}
            isoDay={isoDay}
            waiting={waiting}
            scheduled={scheduled}
            defaultTime={time}
            hidden={index < round}
            onStart={() => setRound((current) => (current === index ? index + 1 : current))}
          />
        );
      })}
    </>
  );
}

function SlotForm({
  isoDay,
  waiting,
  scheduled,
  defaultTime,
  hidden,
  onStart,
}: {
  isoDay: string;
  waiting: Array<{ id: string; title: string }>;
  scheduled: Array<{ id: string; title: string }>;
  defaultTime: string;
  hidden: boolean;
  onStart: () => void;
}) {
  const picks = useDayPicks();
  const [time, setTime] = useState(defaultTime);
  const value = picks?.value(isoDay) || "";
  return (
    <form
      action={parkCard}
      className={hidden ? "hidden" : "mt-3 space-y-2"}
      onSubmit={() => {
        picks?.choose(isoDay, "");
        onStart();
      }}
    >
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
      <input type="hidden" name="scheduledAt" value={`${isoDay}T${time}`} />
      <input
        type="time"
        value={time}
        onChange={(event) => setTime(event.target.value)}
        className="field text-xs"
        required
      />
      <ScheduleButton
        label="Schedule here"
        className="w-full rounded-lg bg-sun px-2 py-1.5 text-xs font-semibold text-ink"
      />
      {hidden ? null : (
        <p className="text-[11px] text-mute">This day. Change the time for a second video. Grey ones are already scheduled.</p>
      )}
    </form>
  );
}
