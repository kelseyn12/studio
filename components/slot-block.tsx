import { ClipTile } from "@/components/clip-tile";
import { DropZone } from "@/components/drop-zone";
import { formatBytes, STUDIO_FILE_MAX_BYTES } from "@/lib/storage";
import type { DrawnStyle } from "@/lib/text-style";

export function SlotBlock({
  id,
  slot,
  title,
  meta,
  hint,
  clips,
  showHook,
  hookText,
  look,
  listCount,
  listFromHook,
}: {
  id: string;
  slot: string;
  title: string;
  meta: string;
  hint: string;
  showHook?: boolean;
  hookText?: string;
  look?: DrawnStyle;
  listCount?: number;
  listFromHook?: { headline: string; x: number; y: number; places?: { tiktok?: { x: number; y: number }; instagram?: { x: number; y: number } } };
  clips: Array<{
    id: string;
    filename: string;
    path: string;
    thumbPath: string;
    hookText: string;
    postCaption?: string;
    logosJson?: string;
    hookLayout?: string;
    captionsJson?: string;
    cutUndo?: string;
  }>;
}) {
  return (
    <div className="rounded-card border border-line bg-panel p-5">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-xs uppercase tracking-[0.12em] text-mute">{meta}</p>
      </div>
      <p className="mb-4 text-sm text-mute">{hint}</p>
      <div className="mb-4 flex gap-3 overflow-x-auto pb-2">
        {clips.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-8 text-sm text-mute">Nothing in this row yet.</p>
        ) : (
          clips.map((clip) => (
            <ClipTile
              key={clip.id}
              {...clip}
              showHook={Boolean(showHook)}
              look={look}
              slot={slot}
              listCount={listCount}
              listFromHook={listFromHook}
            />
          ))
        )}
      </div>
      <DropZone
        action="/api/repurpose/clips"
        extra={{ batchId: id, slot, ...(hookText ? { hookText } : {}) }}
        label={`Add ${title === "CTAs" ? title : title.toLowerCase()}`}
        accept="video/*"
        maxBytes={STUDIO_FILE_MAX_BYTES}
        hint={`One take per file, under ${formatBytes(STUDIO_FILE_MAX_BYTES)}. 4K is fine.`}
      />
    </div>
  );
}
