"use client";

import { useRef, useState } from "react";
import { tuneOutput } from "@/app/repurposer/output-actions";
import type { TuneSection } from "@/lib/output-recipe";

type Panel = "off" | "tune" | "cover";

export function nextPanel(open: Panel, clicked: Exclude<Panel, "off">): Panel {
  return open === clicked ? "off" : clicked;
}

async function saveCover(assetId: string, at: number, setNote: (note: string) => void) {
  if (!assetId) {
    setNote("Generate again, then pick the cover.");
    return;
  }
  const response = await fetch("/api/cover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: assetId, at }),
  });
  setNote(response.ok ? "Cover saved." : "Could not set that frame.");
}

export function OutputTune({
  outputId,
  src,
  tracks,
  musicTrackId,
  musicStart,
  sections,
  mates,
  ready,
  assetId,
}: {
  outputId: string;
  src: string;
  tracks: Array<{ id: string; filename: string }>;
  musicTrackId: string;
  musicStart: number;
  sections: TuneSection[];
  mates: number;
  ready: boolean;
  assetId: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState<Panel>("off");
  const [start, setStart] = useState(musicStart > 0 ? musicStart.toFixed(1) : "0");
  const [coverNote, setCoverNote] = useState("");
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setOpen(nextPanel(open, "tune"))}
          className={`text-xs ${open === "tune" ? "text-sun" : "text-mute"}`}
        >
          Words + music
        </button>
        <button
          type="button"
          onClick={() => setOpen(nextPanel(open, "cover"))}
          className={`text-xs ${open === "cover" ? "text-sun" : "text-mute"}`}
        >
          Cover
        </button>
      </div>
      {open === "cover" ? (
        <div className="space-y-2 border-t border-line pt-3">
          <video ref={videoRef} src={src} controls playsInline className="aspect-[9/16] w-36 rounded-lg bg-ink" />
          <button
            type="button"
            className="rounded-lg border border-line px-2 py-1 text-xs"
            onClick={() => void saveCover(assetId, videoRef.current?.currentTime ?? 0, setCoverNote)}
          >
            Use this frame as the cover
          </button>
          {coverNote ? <p className="text-xs text-mute">{coverNote}</p> : null}
        </div>
      ) : null}
      {open === "tune" && !ready ? (
        <p className="text-xs text-mute">
          Generate again to tune this video. This one was built before words and music could be set per video.
        </p>
      ) : null}
      {open === "tune" && ready ? (
        <form action={tuneOutput} className="space-y-2 border-t border-line pt-3">
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
      ) : null}
    </div>
  );
}
