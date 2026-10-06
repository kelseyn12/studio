import { labelDay } from "@/lib/dates";
import { wordsSheet } from "@/lib/editor-batches";
import { httpsUrl, parseReferences } from "@/lib/references";

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
    referencesJson: string;
    deadlineAt: Date | null;
  };
}) {
  const words = wordsSheet(card);
  const script = card.script.trim();
  const references = parseReferences(card.referencesJson, card.referenceUrl);
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
    </div>
  );
}
