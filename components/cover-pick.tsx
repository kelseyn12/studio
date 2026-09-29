"use client";

import { useEffect, useRef, useState } from "react";

export function CoverPick({
  id,
  src,
  coverAt = 0,
  compact = false,
}: {
  id: string;
  src: string;
  coverAt?: number;
  compact?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(coverAt > 0 ? coverAt : null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || savedAt == null) return;
    const jump = () => {
      video.currentTime = savedAt;
    };
    if (video.readyState >= 1) jump();
    else video.addEventListener("loadedmetadata", jump, { once: true });
  }, [src, savedAt]);

  async function save() {
    if (!id) {
      setError("Generate again, then pick the cover.");
      return;
    }
    setBusy(true);
    setError("");
    const at = videoRef.current?.currentTime ?? 0;
    const response = await fetch("/api/cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, at }),
    });
    setBusy(false);
    if (!response.ok) {
      setError("Could not set that frame");
      return;
    }
    setSavedAt(at);
  }

  return (
    <div className="space-y-2">
      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        className={compact ? "aspect-[9/16] w-36 rounded-lg bg-ink" : "w-full rounded-xl bg-ink"}
      />
      <button
        type="button"
        onClick={() => void save()}
        disabled={busy}
        className={
          compact
            ? "rounded-lg border border-line px-2 py-1 text-xs disabled:opacity-60"
            : "w-full rounded-xl border border-line px-3 py-2 text-sm disabled:opacity-60"
        }
      >
        {busy ? "Saving…" : savedAt != null ? "Use this frame instead" : "Use this frame as the cover"}
      </button>
      <p className="text-xs text-mute">
        {savedAt != null
          ? "Saved. Wrong frame? Play to a new one and tap again."
          : "Play to the frame with the hook, then save. That picture is the cover on Instagram, TikTok, and YouTube."}
      </p>
      {error ? <p className="text-xs text-review">{error}</p> : null}
    </div>
  );
}
