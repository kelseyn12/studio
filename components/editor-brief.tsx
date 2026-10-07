import { splitChangeNote } from "@/lib/change-note";
import { labelDay } from "@/lib/dates";
import { wordsSheet } from "@/lib/editor-batches";
import { httpsUrl, parseReferences } from "@/lib/references";
import { watchUrl } from "@/lib/urls";

/** Everything the editor needs to read before he cuts: deadline, note, words, script, reference. */
export function EditorBrief({
  card,
  voices = [],
  revision = false,
}: {
  revision?: boolean;
  card: {
    hook: string;
    body: string;
    plug: string;
    script: string;
    editorNote: string;
    referenceUrl: string;
    referencesJson: string;
    deadlineAt: Date | null;
  };
  voices?: Array<{ id: string; path: string; filename: string }>;
}) {
  const words = wordsSheet(card);
  const script = card.script.trim();
  const references = parseReferences(card.referencesJson, card.referenceUrl);
  const note = splitChangeNote(card.editorNote);
  const fixVoices = voices.filter((file) => file.filename === "fix-note.webm");
  const briefVoices = voices.filter((file) => file.filename !== "fix-note.webm");
  const voicePlayer = (file: { id: string; path: string; filename: string }, label: string) => (
    <div key={file.id} className="rounded-xl bg-lift px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <p className="font-semibold">{label}</p>
        <a href={watchUrl(file.path)} download={file.filename} className="text-sun">
          Download
        </a>
      </div>
      <audio controls src={watchUrl(file.path)} className="w-full" />
    </div>
  );
  const hasOriginal =
    briefVoices.length > 0 ||
    Boolean(card.deadlineAt) ||
    Boolean(note.brief) ||
    words.length > 0 ||
    Boolean(script) ||
    references.length > 0;
  const original = (
    <>
      {briefVoices.map((file) => voicePlayer(file, "Voice note"))}
      {card.deadlineAt ? (
        <p className="rounded-xl bg-sun/15 px-4 py-2 text-sm font-semibold">Due {labelDay(card.deadlineAt)}</p>
      ) : null}
      {note.brief ? <p className="whitespace-pre-wrap rounded-xl bg-lift px-4 py-3 text-sm">{note.brief}</p> : null}
      {words.length > 0 ? (
        <dl className="space-y-1 rounded-xl bg-lift px-4 py-3 text-sm">
          <p className="text-xs text-mute">Words to put on the video</p>
          {words.map((line) => (
            <div key={line.label} className="flex gap-2">
              <dt className="w-10 shrink-0 text-mute">{line.label}</dt>
              <dd className="whitespace-pre-wrap">{line.words}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {script ? (
        <details className="rounded-xl bg-lift px-4 py-3 text-sm">
          <summary className="cursor-pointer text-xs text-mute">Script — what is said in the video</summary>
          <p className="mt-2 whitespace-pre-wrap">{script}</p>
        </details>
      ) : null}
      {references.length > 0 ? (
        <div className="space-y-2">
          {references.map((link, index) => {
            const href = httpsUrl(link.url);
            const label = references.length === 1 ? "Reference" : `Reference ${index + 1}`;
            return (
              <div key={`${link.url}-${index}`} className="rounded-xl bg-lift px-4 py-3 text-sm">
                {href ? (
                  <a href={href} target="_blank" rel="noreferrer" className="underline">
                    {label}
                  </a>
                ) : (
                  <p>{link.url || label}</p>
                )}
                {link.note ? <p className="mt-1 whitespace-pre-wrap text-mute">{link.note}</p> : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
  return (
    <div className="mb-3 space-y-3">
      {note.fix ? (
        <div className="rounded-xl bg-sun/15 px-4 py-3 text-sm">
          <p className="mb-1 font-semibold">Fix this, then drop the new video</p>
          <p className="whitespace-pre-wrap">{note.fix}</p>
        </div>
      ) : null}
      {fixVoices.map((file) => voicePlayer(file, "Listen to the fix"))}
      {revision && hasOriginal ? (
        <details className="rounded-xl border border-line px-4 py-3 text-sm">
          <summary className="cursor-pointer text-mute">Original brief</summary>
          <div className="mt-3 space-y-3">{original}</div>
        </details>
      ) : revision ? null : (
        original
      )}
    </div>
  );
}
