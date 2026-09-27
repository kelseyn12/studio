"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function CoverPick({ id, src }: { id: string; src: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
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
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <video ref={videoRef} src={src} controls playsInline className="w-full rounded-xl bg-ink" />
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="w-full rounded-xl border border-line px-3 py-2 text-sm"
      >
        {busy ? "Saving…" : "Use this frame as the cover"}
      </button>
      {error ? <p className="text-xs text-review">{error}</p> : null}
    </div>
  );
}
