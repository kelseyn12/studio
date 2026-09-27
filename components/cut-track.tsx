"use client";

import type { PointerEvent } from "react";
import type { TimeRange } from "@/lib/cut-math";

export function CutTrack({
  duration,
  current,
  start,
  end,
  drops,
  onSeek,
  onStart,
  onEnd,
}: {
  duration: number;
  current: number;
  start: number;
  end: number;
  drops: TimeRange[];
  onSeek: (time: number) => void;
  onStart: (time: number) => void;
  onEnd: (time: number) => void;
}) {
  if (duration <= 0) return null;
  const pct = (time: number) => `${(Math.min(duration, Math.max(0, time)) / duration) * 100}%`;

  function timeAt(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return Math.min(duration, Math.max(0, ((event.clientX - box.left) / box.width) * duration));
  }

  return (
    <div className="space-y-1">
      <div
        className="relative h-8 cursor-pointer overflow-hidden rounded-lg bg-lift"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          onSeek(timeAt(event));
        }}
        onPointerMove={(event) => {
          if (event.buttons === 1) onSeek(timeAt(event));
        }}
      >
        <div className="absolute inset-y-0 bg-sun/25" style={{ left: pct(start), width: `calc(${pct(end)} - ${pct(start)})` }} />
        {drops.map((drop, index) => (
          <div
            key={`${drop.start}-${drop.end}-${index}`}
            className="absolute inset-y-0 bg-ink/70"
            style={{ left: pct(drop.start), width: `calc(${pct(drop.end)} - ${pct(drop.start)})` }}
          />
        ))}
        <div className="absolute inset-y-0 w-0.5 bg-sun" style={{ left: pct(current) }} />
        <button
          type="button"
          className="absolute top-0 h-full w-2 -translate-x-1/2 bg-sun"
          style={{ left: pct(start) }}
          onPointerDown={(event) => {
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (event.buttons !== 1) return;
            const box = event.currentTarget.parentElement?.getBoundingClientRect();
            if (!box) return;
            onStart(Math.min(end - 0.15, Math.max(0, ((event.clientX - box.left) / box.width) * duration)));
          }}
        />
        <button
          type="button"
          className="absolute top-0 h-full w-2 -translate-x-1/2 bg-sun"
          style={{ left: pct(end) }}
          onPointerDown={(event) => {
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (event.buttons !== 1) return;
            const box = event.currentTarget.parentElement?.getBoundingClientRect();
            if (!box) return;
            onEnd(Math.max(start + 0.15, Math.min(duration, ((event.clientX - box.left) / box.width) * duration)));
          }}
        />
      </div>
      <p className="text-[11px] text-mute">
        Drag the yellow ends to chop the start or the end. Click the bar to move through the clip. A dark band is a middle you threw away.
      </p>
    </div>
  );
}
