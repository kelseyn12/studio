"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { tuneBodyVideos, tuneThisVideo } from "@/app/repurposer/output-actions";
import { CoverPick } from "@/components/cover-pick";
import type { TuneSection } from "@/lib/output-recipe";

type Panel = "off" | "tune" | "cover";

export function nextPanel(open: Panel, clicked: Exclude<Panel, "off">): Panel {
  return open === clicked ? "off" : clicked;
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
  coverAt,
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
  coverAt?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState<Panel>("off");
  const [start, setStart] = useState(musicStart > 0 ? musicStart.toFixed(1) : "0");
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
        <div className="border-t border-line pt-3">
          <CoverPick id={assetId} src={src} coverAt={coverAt} compact />
        </div>
      ) : null}
      {open === "tune" && !ready ? (
        <p className="text-xs text-mute">
          Generate again to tune this video. This one was built before words and music could be set per video.
        </p>
      ) : null}
      {open === "tune" && ready ? (
        <form className="space-y-2 border-t border-line pt-3">
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
          <RebuildButtons mates={mates} />
        </form>
      ) : null}
    </div>
  );
}

function RebuildButtons({ mates }: { mates: number }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        formAction={tuneThisVideo}
        disabled={pending}
        className="w-full rounded-lg bg-sun px-3 py-2 text-sm font-semibold text-ink disabled:opacity-60"
      >
        {pending ? "Rebuilding…" : "Rebuild this video"}
      </button>
      {mates > 1 ? (
        <button
          formAction={tuneBodyVideos}
          disabled={pending}
          className="w-full rounded-lg border border-line px-3 py-2 text-sm disabled:opacity-60"
        >
          {pending ? "Rebuilding every video from this body…" : `Rebuild every video from this body (${mates})`}
        </button>
      ) : null}
      {pending ? <p className="text-xs text-sun">Stay on this page. A few videos can take a minute.</p> : null}
    </>
  );
}
