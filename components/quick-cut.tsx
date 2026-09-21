"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MIN_KEEP_SECONDS = 0.5;

export function QuickCut({
  src,
  target,
  id,
  note,
}: {
  src: string;
  target: "clip" | "asset";
  id: string;
  note?: string;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const keep = Math.max(0, end - start);
  const canSave = keep >= MIN_KEEP_SECONDS && !busy;

  async function save() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/trim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, id, start, end }),
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
        onLoadedMetadata={(event) => {
          const total = event.currentTarget.duration || 0;
          setDuration(total);
          setEnd(total);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStart(Math.min(videoRef.current?.currentTime ?? 0, end))}
          className="rounded-xl border border-line px-3 py-1.5 text-sm"
        >
          Start here
        </button>
        <button
          type="button"
          onClick={() => setEnd(Math.max(videoRef.current?.currentTime ?? duration, start))}
          className="rounded-xl border border-line px-3 py-1.5 text-sm"
        >
          End here
        </button>
        <button
          type="button"
          onClick={() => {
            setStart(0);
            setEnd(duration);
          }}
          className="rounded-xl border border-line px-3 py-1.5 text-sm text-mute"
        >
          Reset
        </button>
      </div>
      <p className="text-xs text-mute">
        Keeps {start.toFixed(1)}s → {end.toFixed(1)}s · {keep.toFixed(1)}s of video
      </p>
      {note ? <p className="text-xs text-mute">{note}</p> : null}
      {error ? <p className="text-xs text-review">{error}</p> : null}
      <button
        type="button"
        onClick={save}
        disabled={!canSave}
        className="w-full rounded-xl bg-sun px-3 py-2 text-sm font-semibold text-ink disabled:opacity-40"
      >
        {busy ? "Cutting…" : "Cut it"}
      </button>
    </div>
  );
}
