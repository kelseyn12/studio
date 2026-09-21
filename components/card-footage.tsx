import { finishStage, updateCard } from "@/app/cards/[id]/actions";
import { DropZone } from "@/components/drop-zone";
import { VoiceBox } from "@/components/voice-box";
import { REFERENCE_MAX_BYTES } from "@/lib/files";
import { STUDIO_FILE_MAX_BYTES } from "@/lib/storage";

export function CardFootage({
  card,
  editors,
}: {
  card: { id: string; rawsUrl: string; editorId: string | null };
  editors: Array<{ id: string; name: string; defaultEditor?: boolean }>;
}) {
  const defaultEditor = editors.find((person) => person.defaultEditor)?.id ?? card.editorId ?? "";
  return (
    <div className="space-y-4">
      <p className="text-sm text-mute">
        Phone clips and voice live here. A 4K day stays a Drive folder — paste the link. Then pick: you cut, or send to the editor.
      </p>
      <form action={finishStage.bind(null, "footage")} className="space-y-3">
        <input type="hidden" name="id" value={card.id} />
        <input name="rawsUrl" defaultValue={card.rawsUrl} placeholder="4K folder — Drive or Dropbox" className="field" />
        {card.rawsUrl ? (
          <a href={card.rawsUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-line px-4 py-3 text-center">
            Open Drive folder
          </a>
        ) : null}
        {editors.length > 0 ? (
          <select name="editorId" defaultValue={defaultEditor} className="field">
            <option value="">Editor if you send</option>
            {editors.map((person) => (
              <option key={person.id} value={person.id}>
                {person.defaultEditor ? `${person.name} · default` : person.name}
              </option>
            ))}
          </select>
        ) : null}
        <button formAction={updateCard} className="w-full rounded-xl border border-line py-3">
          Save
        </button>
        <div className="grid gap-2 sm:grid-cols-2">
          <button name="cutBy" value="SELF" className="rounded-xl bg-sun py-3 font-semibold text-ink">
            I’ll cut this
          </button>
          <button name="cutBy" value="EDITOR" className="rounded-xl border border-line py-3">
            Send to editor
          </button>
        </div>
      </form>
      <VoiceBox cardId={card.id} />
      <DropZone
        action="/api/assets"
        extra={{ id: card.id, kind: "VOICE" }}
        label="Drop a voice note"
        hint="Audio file under 40MB. Whisper writes the editor note."
        accept="audio/*"
        maxBytes={REFERENCE_MAX_BYTES}
      />
      <DropZone
        action="/api/assets"
        extra={{ id: card.id, kind: "RAW" }}
        label="Upload small clips"
        hint="Phone clips and stills under 250MB. Not a 4K day — that is the Drive link above."
        accept="video/*,image/*,audio/*"
        maxBytes={STUDIO_FILE_MAX_BYTES}
      />
      <DropZone
        action="/api/assets"
        extra={{ id: card.id, kind: "REFERENCE" }}
        label="Reference stills"
        hint="Optional screenshots under 40MB"
        maxBytes={REFERENCE_MAX_BYTES}
      />
    </div>
  );
}
