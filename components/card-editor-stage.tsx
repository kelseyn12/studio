import { attachEditedUrl, finishStage, updateCard } from "@/app/cards/[id]/actions";
import { DropZone } from "@/components/drop-zone";
import { EditorNeed } from "@/components/editor-need";
import { PacketFiles } from "@/components/packet-files";
import type { PacketItem } from "@/lib/editor-packet";
import { publicFileUrl } from "@/lib/urls";
import { STUDIO_FILE_MAX_BYTES } from "@/lib/storage";

export function CardEditorStage({
  card,
  editors,
  packet,
  files,
  edited,
  desk,
}: {
  card: {
    id: string;
    editorId: string | null;
    editorNote: string;
    cutBy: "SELF" | "EDITOR";
    rawsUrl: string;
  };
  editors: Array<{ id: string; name: string; defaultEditor?: boolean }>;
  packet: PacketItem[];
  files: Array<{ id: string; kind: string; filename: string; path: string; publicUrl: string }>;
  edited?: { path: string; publicUrl: string | null };
  desk: boolean;
}) {
  const self = card.cutBy === "SELF" && !desk;
  return (
    <div className="space-y-4">
      <section className="rounded-card border border-line bg-panel p-5">
        <h2 className="mb-1 font-semibold">{self ? "You cut this" : desk ? "Your job" : "Files for the editor"}</h2>
        <p className="mb-3 text-sm text-mute">
          {self
            ? "Download if you need the clips. Cut the finished video. Drop it below."
            : desk
              ? "Download the files, cut the finished video, drop it here or paste a direct mp4 link."
              : "Send only if someone else cuts this. I’ll cut this is on Clips."}
        </p>
        {desk && card.editorNote ? (
          <p className="mb-3 rounded-xl bg-lift px-4 py-3 text-sm">{card.editorNote}</p>
        ) : null}
        <EditorNeed items={packet} />
      </section>
      <PacketFiles rawsUrl={card.rawsUrl} files={files} />
      {self || desk ? null : (
        <form action={finishStage.bind(null, "editor")} className="space-y-3">
          <input type="hidden" name="id" value={card.id} />
          <input type="hidden" name="cutBy" value="EDITOR" />
          <select
            name="editorId"
            defaultValue={card.editorId ?? editors.find((person) => person.defaultEditor)?.id ?? ""}
            className="field"
            required={editors.length > 0}
          >
            <option value="">Choose editor</option>
            {editors.map((person) => (
              <option key={person.id} value={person.id}>
                {person.defaultEditor ? `${person.name} · default` : person.name}
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
      {self ? (
        <form action={updateCard} className="space-y-3">
          <input type="hidden" name="id" value={card.id} />
          <textarea
            name="editorNote"
            defaultValue={card.editorNote}
            placeholder="Notes for yourself"
            className="field min-h-16"
          />
          <button className="rounded-xl border border-line px-4 py-2 text-sm">Save notes</button>
        </form>
      ) : null}
      <DropZone
        action="/api/assets"
        extra={{ id: card.id, kind: "EDITED" }}
        label="Drop the finished video"
        hint="The export that posts. Under 250MB. Not a 4K day."
        accept="video/*"
        maxBytes={STUDIO_FILE_MAX_BYTES}
      />
      <form action={attachEditedUrl} className="space-y-2 rounded-card border border-line bg-panel p-5">
        <input type="hidden" name="id" value={card.id} />
        <p className="text-sm text-mute">Or paste a direct video link. Not a Drive folder.</p>
        <input name="editedUrl" placeholder="https://…/export.mp4" className="field" />
        <button className="rounded-xl border border-line px-4 py-2 text-sm">Attach URL</button>
      </form>
      {edited ? (
        <a
          href={edited.publicUrl || publicFileUrl(edited.path)}
          className="block rounded-xl bg-sun px-4 py-3 text-center font-semibold text-ink"
        >
          Open the finished video
        </a>
      ) : null}
    </div>
  );
}
