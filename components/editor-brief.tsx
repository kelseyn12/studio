import { labelDay } from "@/lib/dates";
import { wordsSheet } from "@/lib/editor-batches";

function safeLink(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Everything the editor needs to read before he cuts: deadline, note, words, script, reference. */
export function EditorBrief({
  card,
}: {
  card: {
    hook: string;
    body: string;
    plug: string;
    script: string;
    editorNote: string;
    referenceUrl: string;
    deadlineAt: Date | null;
  };
}) {
  const words = wordsSheet(card);
  const script = card.script.trim();
  const reference = safeLink(card.referenceUrl);
  return (
    <div className="mb-3 space-y-3">
      {card.deadlineAt ? (
        <p className="rounded-xl bg-sun/15 px-4 py-2 text-sm font-semibold">Due {labelDay(card.deadlineAt)}</p>
      ) : null}
      {card.editorNote ? <p className="rounded-xl bg-lift px-4 py-3 text-sm">{card.editorNote}</p> : null}
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
      {reference ? (
        <a href={reference} target="_blank" rel="noreferrer" className="block text-sm underline">
          Reference video — match this feel
        </a>
      ) : null}
    </div>
  );
}
