"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SPEED_CHOICES, isPlayableCut, keepRanges, keptSeconds } from "@/lib/cut-math";

type Drop = { start: number; end: number };

export function QuickCut({
  src,
  target,
  id,
  note,
  canUndo,
}: {
  src: string;
  target: "clip" | "asset";
  id: string;
  note?: string;
  canUndo?: boolean;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [dropFrom, setDropFrom] = useState<number | null>(null);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [speed, setSpeed] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  const playhead = () => videoRef.current?.currentTime ?? 0;
  const ranges = keepRanges({ start, end }, drops);
  const remaining = keptSeconds(ranges) / speed;
  const canSave = isPlayableCut(ranges) && !busy;

  function addDrop() {
    const to = playhead();
    if (dropFrom === null || to - dropFrom < 0.15) {
      setError("Play to the end of the dragging part, then tap Cut to here.");
      return;
    }
    setDrops((current) => [...current, { start: dropFrom, end: to }]);
    setDropFrom(null);
    setError("");
  }

  async function save() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/trim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, id, start, end, drops, speed }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(String(body.error || "Cut failed"));
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        preload="metadata"
        className="w-full rounded-xl bg-ink"
        onPlay={() => {
          if (videoRef.current) videoRef.current.playbackRate = speed;
        }}
        onLoadedMetadata={(event) => {
          const total = event.currentTarget.duration || 0;
          setDuration(total);
          setEnd(total);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStart(Math.min(playhead(), end))}
          className="rounded-xl border border-line px-3 py-1.5 text-sm"
        >
          Start here
        </button>
        <button
          type="button"
          onClick={() => setEnd(Math.max(playhead(), start))}
          className="rounded-xl border border-line px-3 py-1.5 text-sm"
        >
          End here
        </button>
        <button
          type="button"
          onClick={() => {
            setDropFrom(playhead());
            setError("");
          }}
          className="rounded-xl border border-line px-3 py-1.5 text-sm"
        >
          Cut from here
        </button>
        <button type="button" onClick={addDrop} className="rounded-xl border border-line px-3 py-1.5 text-sm">
          Cut to here
        </button>
        <button
          type="button"
          onClick={() => {
            setStart(0);
            setEnd(duration);
            setDrops([]);
            setDropFrom(null);
            setSpeed(1);
          }}
          className="rounded-xl border border-line px-3 py-1.5 text-sm text-mute"
        >
          Reset
        </button>
      </div>
      {dropFrom !== null ? <p className="text-xs text-sun">Dropping from {dropFrom.toFixed(1)}s — play to the end of it, then Cut to here.</p> : null}
      {drops.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {drops.map((drop, index) => (
            <button
              key={`${drop.start}-${drop.end}-${index}`}
              type="button"
              onClick={() => setDrops((current) => current.filter((_, item) => item !== index))}
              className="rounded-lg border border-line px-2 py-1 text-xs text-mute"
            >
              Drop {drop.start.toFixed(1)}–{drop.end.toFixed(1)}s ×
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-mute">Speed</span>
        {SPEED_CHOICES.map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => setSpeed(choice)}
            className={`rounded-xl px-3 py-1.5 text-sm ${speed === choice ? "bg-sun font-semibold text-ink" : "border border-line"}`}
          >
            {choice}×
          </button>
        ))}
      </div>
      <p className="text-xs text-mute">
        Keeps {start.toFixed(1)}s → {end.toFixed(1)}s
        {drops.length ? ` · drops ${drops.length} part${drops.length === 1 ? "" : "s"}` : ""}
        {speed !== 1 ? ` · ${speed}×` : ""} · posts as {remaining.toFixed(1)}s
      </p>
      {note ? <p className="text-xs text-mute">{note}</p> : null}
      {error ? <p className="text-xs text-review">{error}</p> : null}
      <div className="flex gap-2">
        {canUndo ? (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              const response = await fetch("/api/trim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ target, id, undo: true }),
              });
              setBusy(false);
              if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                setError(String(body.error || "Nothing to undo"));
                return;
              }
              router.refresh();
            }}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm text-mute"
          >
            Undo last cut
          </button>
        ) : null}
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="w-full rounded-xl bg-sun px-3 py-2 text-sm font-semibold text-ink disabled:opacity-40"
        >
          {busy ? "Cutting…" : "Save cut"}
        </button>
      </div>
    </div>
  );
}
