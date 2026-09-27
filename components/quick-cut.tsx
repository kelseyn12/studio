"use client";

import { useEffect, useRef, useState } from "react";
import { SPEED_CHOICES, isPlayableCut, keepRanges, keptSeconds } from "@/lib/cut-math";
import { publicFileUrl } from "@/lib/urls";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playSrc, setPlaySrc] = useState(src);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [dropFrom, setDropFrom] = useState<number | null>(null);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [speed, setSpeed] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [undoReady, setUndoReady] = useState(Boolean(canUndo));

  useEffect(() => {
    setPlaySrc(src);
    setUndoReady(Boolean(canUndo));
  }, [src, canUndo]);

  function applyRate(rate: number) {
    const video = videoRef.current;
    if (!video) return;
    video.defaultPlaybackRate = rate;
    video.playbackRate = rate;
    video.preservesPitch = true;
  }

  useEffect(() => {
    applyRate(speed);
  }, [speed, playSrc]);

  const playhead = () => videoRef.current?.currentTime ?? 0;
  const ranges = keepRanges({ start, end }, drops);
  const remaining = keptSeconds(ranges) / speed;
  const canSave = isPlayableCut(ranges) && !busy;

  function resetWindow(total: number) {
    setDuration(total);
    setStart(0);
    setEnd(total);
    setDrops([]);
    setDropFrom(null);
    setSpeed(1);
  }

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

  async function postTrim(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    const response = await fetch("/api/trim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(String(payload.error || "Cut failed"));
      return null;
    }
    return payload as { ok: true; path?: string };
  }

  async function save() {
    const payload = await postTrim({ target, id, start, end, drops, speed });
    if (!payload) return;
    if (payload.path) setPlaySrc(publicFileUrl(payload.path));
    setUndoReady(true);
    resetWindow(0);
  }

  async function undo() {
    const payload = await postTrim({ target, id, undo: true });
    if (!payload) return;
    setPlaySrc(payload.path ? publicFileUrl(payload.path) : src);
    setUndoReady(false);
    resetWindow(0);
  }

  return (
    <div className="space-y-2">
      <video
        key={playSrc}
        ref={videoRef}
        src={playSrc}
        controls
        playsInline
        preload="metadata"
        autoPlay={playSrc !== src}
        className="w-full rounded-xl bg-ink"
        onLoadedMetadata={(event) => {
          const total = event.currentTarget.duration;
          if (!Number.isFinite(total) || total <= 0) return;
          setDuration(total);
          setEnd((current) => (current <= 0 || current > total ? total : current));
          applyRate(speed);
        }}
        onPlay={() => applyRate(speed)}
        onPlaying={() => applyRate(speed)}
        onSeeked={() => applyRate(speed)}
        onRateChange={() => {
          if (videoRef.current && Math.abs(videoRef.current.playbackRate - speed) > 0.01) {
            applyRate(speed);
          }
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
          onClick={() => resetWindow(duration)}
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
            onClick={() => {
              setSpeed(choice);
              applyRate(choice);
              void videoRef.current?.play();
            }}
            className={`rounded-xl px-3 py-1.5 text-sm ${speed === choice ? "bg-sun font-semibold text-ink" : "border border-line"}`}
          >
            {choice}×
          </button>
        ))}
      </div>
      <p className="text-xs text-mute">
        Keeps {start.toFixed(1)}s → {end.toFixed(1)}s
        {drops.length ? ` · drops ${drops.length} part${drops.length === 1 ? "" : "s"}` : ""}
        {speed !== 1 ? ` · playing ${speed}×` : ""} · posts as {remaining.toFixed(1)}s
      </p>
      {note ? <p className="text-xs text-mute">{note}</p> : null}
      {error ? <p className="text-xs text-review">{error}</p> : null}
      <div className="flex gap-2">
        {undoReady ? (
          <button
            type="button"
            disabled={busy}
            onClick={undo}
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
