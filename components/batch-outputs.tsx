import Link from "next/link";
import { sendBatchToEditor } from "@/app/repurposer/actions";
import { publicFileUrl } from "@/lib/urls";

type Output = { id: string; label: string; path: string; cardId: string | null };
type CardState = { id: string; status: string; scheduledAt: Date | null };
type Editor = { id: string; name: string; defaultEditor: boolean };

const STATE_LABEL: Record<string, string> = {
  EDITING: "With editor",
  REVIEW: "Back from editor",
  POSTED: "Posted",
  DATA: "Posted",
};

function stateLabel(card: CardState | undefined): string {
  if (!card) return "";
  if (card.status === "READY") return card.scheduledAt ? "Scheduled" : "Ready";
  return STATE_LABEL[card.status] ?? "";
}

function polishMessage(polish: string | undefined): string | null {
  if (!polish) return null;
  if (polish === "no-editor") return "No editor on the team yet. Add one on Team first.";
  if (polish === "none") return "Nothing left to send — everything is scheduled or already with the editor.";
  return `${polish} video${polish === "1" ? "" : "s"} sent to your editor. They show up in Cuts.`;
}

export function BatchOutputs({
  batchId,
  outputs,
  cards,
  editors,
  canPolish,
  polish,
}: {
  batchId: string;
  outputs: Output[];
  cards: CardState[];
  editors: Editor[];
  canPolish: number;
  polish?: string;
}) {
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const message = polishMessage(polish);
  const defaultEditor = editors.find((person) => person.defaultEditor)?.id ?? editors[0]?.id ?? "";
  return (
    <div className="mt-8 space-y-4">
      {message ? <p className="text-sm text-sun">{message}</p> : null}
      {canPolish > 0 ? (
        <form action={sendBatchToEditor} className="space-y-3 rounded-card border border-line bg-panel p-5">
          <input type="hidden" name="id" value={batchId} />
          <p className="text-sm text-mute">
            Want a human pass on these? Send all {canPolish} unscheduled video{canPolish === 1 ? "" : "s"} to your editor
            at once. Each one comes back to Ready when they drop the fixed file.
          </p>
          <textarea
            name="editorNote"
            placeholder="What to polish on every video — tighten hooks, fix caption timing, trim dead air…"
            className="field min-h-20"
          />
          {editors.length > 1 ? (
            <select name="editorId" defaultValue={defaultEditor} className="field">
              {editors.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.defaultEditor ? `${person.name} · default` : person.name}
                </option>
              ))}
            </select>
          ) : null}
          <button className="w-full rounded-xl border border-line px-4 py-3 font-semibold">
            Send all to editor to polish
          </button>
        </form>
      ) : null}
      <div className="space-y-2">
        {outputs.map((output) => {
          const state = stateLabel(output.cardId ? cardById.get(output.cardId) : undefined);
          return (
            <div key={output.id} className="flex items-center justify-between gap-3 rounded-card border border-line bg-panel px-4 py-3">
              <a className="text-sun" href={publicFileUrl(output.path)}>
                {output.label}
              </a>
              <div className="flex items-center gap-3 text-sm text-mute">
                {state ? <span>{state}</span> : null}
                {output.cardId ? <Link href={`/cards/${output.cardId}`}>Open video</Link> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
