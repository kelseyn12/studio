import { finishStage, updateCard } from "@/app/cards/[id]/actions";
import { DropZone } from "@/components/drop-zone";
import { VoiceBox } from "@/components/voice-box";

export function CardFootage({
  card,
}: {
  card: { id: string; rawsUrl: string };
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-mute">
        4K stays in Drive. Studio only needs the folder link and a short voice note for the editor.{" "}
        <a href="/transcriber" className="text-sun">
          Transcribe a file
        </a>
      </p>
      <form action={finishStage.bind(null, "footage")} className="space-y-3">
        <input type="hidden" name="id" value={card.id} />
        <input name="rawsUrl" defaultValue={card.rawsUrl} placeholder="Raws folder — Drive or Dropbox" className="field" />
        {card.rawsUrl ? (
          <a href={card.rawsUrl} target="_blank" rel="noreferrer" className="block rounded-xl bg-sun px-4 py-3 text-center font-semibold text-ink">
            Open raws folder
          </a>
        ) : null}
        <div className="flex gap-2">
          <button formAction={updateCard} className="flex-1 rounded-xl border border-line py-3">
            Save
          </button>
          <button className="flex-1 rounded-xl bg-sun py-3 font-semibold text-ink">Footage is in</button>
        </div>
      </form>
      <VoiceBox cardId={card.id} />
      <DropZone
        action="/api/assets"
        extra={{ id: card.id, kind: "RAW" }}
        label="Tiny stills / voice only"
        hint="Not for 4K"
        accept="image/*,audio/*"
      />
      <DropZone action="/api/assets" extra={{ id: card.id, kind: "REFERENCE" }} label="Reference stills" hint="Optional screenshots" />
    </div>
  );
}
