import { approveCut, requestChanges, sendForTouchUp } from "@/app/cards/[id]/actions";
import { DropZone } from "@/components/drop-zone";
import { REFERENCE_MAX_BYTES } from "@/lib/files";
import { watchUrl } from "@/lib/urls";

function FixDrop({ cardId }: { cardId: string }) {
  return (
    <DropZone
      action="/api/assets"
      extra={{ id: cardId, kind: "REFERENCE" }}
      label="Drop a screenshot"
      hint="Font, text on screen, or a frame to match. Under 40MB. He sees the picture on the fix."
      accept="image/*"
      maxBytes={REFERENCE_MAX_BYTES}
    />
  );
}

function ShotRow({ shots }: { shots: Array<{ id: string; path: string; filename: string }> }) {
  if (shots.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2">
      {shots.map((file) => (
        <img key={file.id} src={watchUrl(file.path)} alt={file.filename} className="w-full rounded-xl bg-ink" />
      ))}
    </div>
  );
}

/** Approve can carry a note. Needs changes can carry a picture of the font or the text style. */
export function ReviewAsk({
  cardId,
  shots,
}: {
  cardId: string;
  shots: Array<{ id: string; path: string; filename: string }>;
}) {
  return (
    <>
      <form action={approveCut} className="space-y-3 rounded-card border border-line bg-panel p-5">
        <input type="hidden" name="id" value={cardId} />
        <p className="text-sm text-mute">Approve pings him. A note is optional. Then set the thumbnail, caption, accounts, and time below.</p>
        <textarea name="note" placeholder="A note for him — good job" className="field min-h-16" />
        <button className="w-full rounded-xl bg-sun px-4 py-3 font-semibold text-ink">Approve</button>
      </form>
      <form action={requestChanges} className="space-y-3 rounded-card border border-line bg-panel p-5">
        <input type="hidden" name="id" value={cardId} />
        <p className="text-sm text-mute">
          Needs changes. Write what to fix. Drop a screenshot if you are showing a font, text style, or a frame.
        </p>
        <textarea
          name="editorNote"
          placeholder="What to fix — hook, captions, end frame…"
          className="field min-h-24"
          required
        />
        <FixDrop cardId={cardId} />
        <ShotRow shots={shots} />
        <button className="w-full rounded-xl border border-line px-4 py-3 font-semibold">Needs changes</button>
      </form>
    </>
  );
}

/** Polish uses the same screenshot drop. The note is required. */
export function PolishAsk({ cardId }: { cardId: string }) {
  return (
    <form action={sendForTouchUp} className="space-y-3 rounded-card border border-line bg-panel p-5">
      <input type="hidden" name="id" value={cardId} />
      <p className="text-sm text-mute">
        Not quite right? Send it to your editor to polish. They drop the fixed video and it lands back in To approve.
      </p>
      <textarea
        name="editorNote"
        placeholder="What to polish — trim the hook, tighten the end, fix captions…"
        className="field min-h-20"
        required
      />
      <FixDrop cardId={cardId} />
      <button className="w-full rounded-xl border border-line px-4 py-3 font-semibold">Send to editor to polish</button>
    </form>
  );
}
