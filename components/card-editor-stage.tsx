import { attachEditedUrl, finishStage, startCutting, updateCard } from "@/app/cards/[id]/actions";
import { CapcutLink } from "@/components/capcut-link";
import { CoverPick } from "@/components/cover-pick";
import { FinishedDrop } from "@/components/finished-drop";
import { EditorNeed } from "@/components/editor-need";
import { PacketFiles } from "@/components/packet-files";
import { EditorBrief } from "@/components/editor-brief";
import { capcutHref } from "@/lib/capcut";
import { visibleAssets } from "@/lib/card-desk";
import type { PacketItem } from "@/lib/editor-packet";
import { formatBytes, STUDIO_FILE_MAX_BYTES } from "@/lib/storage";
import { watchUrl } from "@/lib/urls";

export function CardEditorStage({
  card,
  editors,
  packet,
  files,
  edited,
  desk,
  canStart = false,
  linkNote = false,
}: {
  card: {
    id: string;
    title: string;
    hook: string;
    body: string;
    plug: string;
    script: string;
    referenceUrl: string;
    referencesJson: string;
    deadlineAt: Date | null;
    editorId: string | null;
    editorNote: string;
    capcutUrl: string;
    cutBy: "SELF" | "EDITOR";
    rawsUrl: string;
    status: string;
  };
  editors: Array<{ id: string; name: string; defaultEditor?: boolean }>;
  packet: PacketItem[];
  files: Array<{
    id: string;
    kind: string;
    filename: string;
    path: string;
    publicUrl: string;
    textStyle: string;
    coverAt?: number;
    createdAt: Date;
  }>;
  edited?: { path: string; publicUrl: string | null };
  desk: boolean;
  canStart?: boolean;
  linkNote?: boolean;
}) {
  const self = card.cutBy === "SELF" && !desk;
  const editedLooks = files.filter((file) => file.kind === "EDITED").map((file) => file.textStyle);
  const oneVideo =
    self || desk || editedLooks.length === 0 || editedLooks.some((style) => !style || style === "plain");
  const defaultLook = oneVideo
    ? "plain"
    : editedLooks.includes("tiktok") && !editedLooks.includes("instagram")
      ? "tiktok"
      : "instagram";
  const hasSources =
    Boolean(card.rawsUrl.trim()) ||
    files.some((file) => file.kind === "RAW" || file.kind === "VOICE" || file.kind === "REFERENCE");
  const dropOnly = self && !hasSources;
  return (
    <div className="space-y-4">
      <section className="rounded-card border border-line bg-panel p-5">
        <h2 className="mb-1 font-semibold">
          {dropOnly ? "Drop the finished video" : self ? "You cut this" : desk ? "Your job" : "Files for the editor"}
        </h2>
        <p className="mb-3 text-sm text-mute">
          {dropOnly
            ? "This one is already edited. Drop the file below."
            : self
              ? "Download if you need the clips. Cut the finished video. Drop it below."
              : desk
                ? "One card is one video. Do these in order."
                : "Send only if someone else cuts this. I’ll cut this is on Clips."}
        </p>
        {desk && !dropOnly ? (
          <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm">
            <li>Listen to the voice note. Read the words and the script.</li>
            <li>Open Google Drive for the raw footage. Watch the references here.</li>
            <li>Press Start cutting when you begin. Watching or downloading does not start it.</li>
            <li>Cut one video. Leave Which video on One video.</li>
            <li>Put the finished video in that same Google Drive folder. Any file name is fine.</li>
            <li>Paste your CapCut link so she can open your project.</li>
          </ol>
        ) : null}
        {desk && card.status === "FILMED" ? (
          canStart ? (
            <form action={startCutting} className="mb-3">
              <input type="hidden" name="id" value={card.id} />
              <button className="rounded-xl bg-sun px-4 py-3 font-semibold text-ink">Start cutting</button>
            </form>
          ) : (
            <div className="mb-3">
              <p className="rounded-xl bg-sun px-4 py-3 text-center font-semibold text-ink">Start cutting</p>
              <p className="mt-2 text-xs text-mute">He presses this. You are looking at his page, so it stays in To cut.</p>
            </div>
          )
        ) : null}
        {desk && card.status === "EDITING" ? (
          <p className="mb-3 rounded-xl bg-sun/15 px-4 py-2 text-sm">You are cutting this. Drop the finished video when it is done.</p>
        ) : null}
        {desk ? (
          <EditorBrief
            card={card}
            voices={files.filter((file) => file.kind === "VOICE").map((file) => ({ id: file.id, path: file.path, filename: file.filename }))}
          />
        ) : null}
        {desk ? (
          <form action={updateCard} className="mb-3 space-y-2">
            <input type="hidden" name="id" value={card.id} />
            <input type="hidden" name="step" value="editor" />
            <CapcutLink url={card.capcutUrl} editable />
            <p className="text-xs text-mute">
              This is your project link for her. Save it. If CapCut asks her to join, invite her email on that project.
            </p>
            <button className="rounded-xl border border-line px-4 py-2 text-sm">Save CapCut link</button>
          </form>
        ) : null}
        {!desk && capcutHref(card.capcutUrl) ? (
          <div className="mb-3">
            <p className="mb-2 text-sm font-semibold">His CapCut project</p>
            <CapcutLink url={card.capcutUrl} editable={false} />
          </div>
        ) : null}
        {dropOnly ? null : <EditorNeed items={packet} />}
      </section>
      {dropOnly ? null : <PacketFiles rawsUrl={card.rawsUrl} files={files} />}
      {self || desk ? null : (
        <form action={finishStage.bind(null, "editor")} className="space-y-3">
          <input type="hidden" name="id" value={card.id} />
          <input type="hidden" name="step" value="editor" />
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
      <FinishedDrop
        cardId={card.id}
        defaultLook={defaultLook}
        maxBytes={STUDIO_FILE_MAX_BYTES}
        sizeLabel={formatBytes(STUDIO_FILE_MAX_BYTES)}
      />
      <form action={attachEditedUrl} className="space-y-2 rounded-card border border-line bg-panel p-5">
        <input type="hidden" name="id" value={card.id} />
        <p className="text-sm text-mute">
          Drop the finished video above, or paste a link to that one file. A Drive link to the file is fine. A Drive folder is not.
        </p>
        {linkNote ? (
          <p className="text-sm text-sun">That link did not download a video. Drop the mp4, or paste the Drive link to the file itself.</p>
        ) : null}
        <select name="textStyle" defaultValue={defaultLook} className="field">
          <option value="instagram">IG · FB</option>
          <option value="tiktok">TT · YT</option>
          <option value="plain">One video</option>
        </select>
        <input name="editedUrl" placeholder="https://…/export.mp4" className="field" />
        <button className="rounded-xl border border-line px-4 py-2 text-sm">Attach URL</button>
      </form>
      {visibleAssets(files)
        .filter((file) => file.kind === "EDITED")
        .map((file) => (
          <section key={file.id} className="rounded-card border border-line bg-panel p-5">
            <CoverPick
              id={file.id}
              src={watchUrl(file.path)}
              coverAt={file.coverAt}
              detail={file.textStyle === "tiktok" ? "TT · YT" : file.textStyle === "instagram" ? "IG · FB" : "Every app"}
            />
          </section>
        ))}
      {edited ? (
        <a
          href={watchUrl(edited.path)}
          className="block rounded-xl bg-sun px-4 py-3 text-center font-semibold text-ink"
        >
          Open the finished video
        </a>
      ) : null}
    </div>
  );
}
