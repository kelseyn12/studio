"use client";

import { useRef, useState } from "react";
import { tuneOutput } from "@/app/repurposer/output-actions";
import type { TuneSection } from "@/lib/output-recipe";

export function OutputTune({
  outputId,
  src,
  tracks,
  musicTrackId,
  musicStart,
  sections,
  mates,
  ready,
}: {
  outputId: string;
  src: string;
  tracks: Array<{ id: string; filename: string }>;
  musicTrackId: string;
  musicStart: number;
  sections: TuneSection[];
  mates: number;
  ready: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(musicStart > 0 ? musicStart.toFixed(1) : "0");
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 text-xs text-mute">
        Words + music
      </button>
    );
  }
  if (!ready) {
    return (
      <p className="mt-2 text-xs text-mute">
        Generate again to tune this video. This one was built before words and music could be set per video.
      </p>
    );
  }
  return (
    <form action={tuneOutput} className="mt-3 space-y-2 border-t border-line pt-3">
      <input type="hidden" name="outputId" value={outputId} />
      <video ref={videoRef} src={src} controls playsInline className="aspect-[9/16] w-36 rounded-lg bg-ink" />
      <label className="block text-xs text-mute">
        Music on this video
        <select name="musicTrackId" defaultValue={musicTrackId} className="field mt-1 text-sm">
          <option value="none">None</option>
          {tracks.map((track) => (
            <option key={track.id} value={track.id}>
              {track.filename}
            </option>
          ))}
        </select>
      </label>
      <input type="hidden" name="musicStart" value={start} />
      <p className="text-xs text-mute">Music starts at {start}s. Play to the beat, then mark it.</p>
      <button
        type="button"
        className="rounded-lg border border-line px-2 py-1 text-xs"
        onClick={() => setStart((videoRef.current?.currentTime || 0).toFixed(1))}
      >
        Music starts now
      </button>
      {sections.map((section) => (
        <label key={section.clipId} className="block text-xs text-mute">
          {section.label} sentences — one line each. Times stay.
          <textarea name={`words:${section.clipId}`} defaultValue={section.text} className="field mt-1 min-h-16 text-sm" />
        </label>
      ))}
      <button name="scope" value="one" className="w-full rounded-lg bg-sun px-3 py-2 text-sm font-semibold text-ink">
        Rebuild this video
      </button>
      {mates > 1 ? (
        <button name="scope" value="body" className="w-full rounded-lg border border-line px-3 py-2 text-sm">
          Rebuild every video from this body ({mates})
        </button>
      ) : null}
    </form>
  );
}
