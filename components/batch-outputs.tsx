import Link from "next/link";
import { sendBatchToEditor } from "@/app/repurposer/actions";
import { OutputTune } from "@/components/output-tune";
import { PickBox, SelectDeleteBar, VideoPick } from "@/components/select-videos";
import { bodyMates, parseRecipe, tuneSections } from "@/lib/output-recipe";
import { LOOK_TAG } from "@/lib/text-style";
import { publicFileUrl } from "@/lib/urls";

type Output = {
  id: string;
  label: string;
  path: string;
  cardId: string | null;
  recipeJson: string;
  musicTrackId: string;
  musicStart: number;
  captionsJson: string;
};
type Clip = { id: string; slot: string; captionsJson: string };
type Track = { id: string; filename: string };
type CardState = { id: string; status: string; scheduledAt: Date | null; assets: Array<{ id: string; path: string }> };
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

/** Rows made before the look pill carried "· IG look" in the label; the pill says it now. */
function rowTitle(label: string): string {
  return label.replace(/ · (IG|TT) look$/, "");
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
  tuned,
  clips,
  tracks,
}: {
  batchId: string;
  outputs: Output[];
  cards: CardState[];
  editors: Editor[];
  canPolish: number;
  polish?: string;
  tuned?: string;
  clips: Clip[];
  tracks: Track[];
}) {
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const message = polishMessage(polish);
  const defaultEditor = editors.find((person) => person.defaultEditor)?.id ?? editors[0]?.id ?? "";
  const outputIds = outputs.map((output) => output.id);
  const tunedNote =
    tuned === "1"
      ? "Rebuilt. The new file is on this row."
      : tuned === "body"
        ? "Rebuilt every video that uses that body."
        : tuned === "old"
          ? "That video needs a fresh Generate before it can be tuned."
          : tuned === "fail"
            ? "Rebuild did not finish. Try this video first, then the rest."
            : "";
  return (
    <div className="mt-8 space-y-4">
      {tunedNote ? <p className="text-sm text-sun">{tunedNote}</p> : null}
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
      <VideoPick ids={outputIds}>
        <div className="space-y-2">
          <SelectDeleteBar total={outputs.length} batchId={batchId} field="outputId" />
          {outputs.map((output) => {
            const card = output.cardId ? cardById.get(output.cardId) : undefined;
            const state = stateLabel(card);
            const assetId = card?.assets.find((asset) => asset.path === output.path)?.id ?? "";
            const recipe = parseRecipe(output.recipeJson);
            const selectedMusic = output.musicTrackId === "none" ? "none" : output.musicTrackId || recipe?.trackId || "none";
            const title = rowTitle(output.label);
            const goesTo = recipe ? LOOK_TAG[recipe.look] : "";
            return (
              <div key={output.id} className="rounded-card border border-line bg-panel px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <PickBox id={output.id} />
                  <a className="min-w-0 flex-1 basis-56 break-words text-sun" href={publicFileUrl(output.path)}>
                    {title}
                  </a>
                  {goesTo ? (
                    <span className="shrink-0 rounded-full bg-sun px-2.5 py-0.5 text-xs font-semibold text-ink">{goesTo}</span>
                  ) : null}
                  <div className="ml-auto flex shrink-0 items-center gap-3 text-sm text-mute">
                    {state ? <span>{state}</span> : null}
                    <a href={publicFileUrl(output.path)} download={`${title}${goesTo ? ` · ${goesTo}` : ""}.mp4`}>
                      Download
                    </a>
                    {output.cardId ? <Link href={`/cards/${output.cardId}`}>Open video</Link> : null}
                  </div>
                </div>
                <OutputTune
                  outputId={output.id}
                  src={publicFileUrl(output.path)}
                  tracks={tracks}
                  musicTrackId={selectedMusic}
                  musicStart={output.musicStart}
                  sections={recipe ? tuneSections(recipe, clips, output.captionsJson) : []}
                  mates={bodyMates(outputs.map((row) => row.recipeJson), recipe?.bodyClipId || "")}
                  ready={Boolean(recipe)}
                  assetId={assetId}
                />
              </div>
            );
          })}
        </div>
      </VideoPick>
    </div>
  );
}
