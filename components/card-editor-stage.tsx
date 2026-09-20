import { finishStage, updateCard } from "@/app/cards/[id]/actions";
import { DropZone } from "@/components/drop-zone";
import { EditorNeed } from "@/components/editor-need";
import type { PacketItem } from "@/lib/editor-packet";
import { publicFileUrl } from "@/lib/urls";

export function CardEditorStage({
  card,
  editors,
  packet,
  edited,
  desk,
}: {
  card: { id: string; editorId: string | null; editorNote: string };
  editors: Array<{ id: string; name: string }>;
  packet: PacketItem[];
  edited?: { path: string; publicUrl: string | null };
  desk: boolean;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-card border border-line bg-panel p-5">
        <h2 className="mb-1 font-semibold">{desk ? "Your job" : "Editor packet"}</h2>
        <p className="mb-3 text-sm text-mute">
          {desk
            ? "Open the folder, cut 1080×1920 in CapCut, drop the export."
            : "Assign, paste the Drive folder on Footage, write what must stay in the cut."}
        </p>
        <EditorNeed items={packet} />
      </section>
      {desk ? null : (
        <form action={finishStage.bind(null, "editor")} className="space-y-3">
          <input type="hidden" name="id" value={card.id} />
          <select name="editorId" defaultValue={card.editorId ?? ""} className="field" required={editors.length > 0}>
            <option value="">Choose editor</option>
            {editors.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          <textarea
            name="editorNote"
            defaultValue={card.editorNote}
            placeholder="Must keep / CTA / words to avoid"
            className="field min-h-24"
          />
          <div className="flex gap-2">
            <button formAction={updateCard} className="flex-1 rounded-xl border border-line py-3">
              Save
            </button>
            <button className="flex-1 rounded-xl bg-sun py-3 font-semibold text-ink">Send to editor</button>
          </div>
        </form>
      )}
      <DropZone
        action="/api/assets"
        extra={{ id: card.id, kind: "EDITED" }}
        label="Drop the CapCut export"
        hint="Finished 1080×1920 only"
        accept="video/*"
      />
      {edited ? (
        <a
          href={edited.publicUrl || publicFileUrl(edited.path)}
          className="block rounded-xl bg-sun px-4 py-3 text-center font-semibold text-ink"
        >
          Open the delivered video
        </a>
      ) : null}
    </div>
  );
}
