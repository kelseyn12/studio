"use client";

import Link from "next/link";
import { useState } from "react";
import { DropZone } from "@/components/drop-zone";
import type { NeededLook, WordsLine } from "@/lib/editor-batches";

export type EditorBatchRow = {
  id: string;
  mixLabel: string;
  words: WordsLine[];
  needs: NeededLook[];
  cleanFiles: Array<{ url: string; filename: string }>;
  stage: "send" | "cutting" | "review";
};

const STAGE_LABEL: Record<EditorBatchRow["stage"], string> = {
  send: "Not sent yet",
  cutting: "Cutting",
  review: "To approve",
};

/** One Multiply batch as a folder: every clean video, the words for each, and one drop for the finished files. */
export function EditorBatch({
  name,
  rows,
  editor,
  maxBytes,
  sizeLabel,
}: {
  name: string;
  rows: EditorBatchRow[];
  editor: boolean;
  maxBytes: number;
  sizeLabel: string;
}) {
  const [saving, setSaving] = useState(false);
  const files = rows.flatMap((row) => row.cleanFiles);
  const done = rows.filter((row) => row.needs.every((need) => need.done)).length;
  const twoLooks = rows.some((row) => row.needs.length > 1);
  const nameHint = twoLooks
    ? "Name each file with its mix number and look: “mix 2 IG.mp4” and “mix 2 TT.mp4”."
    : "Name each file with its mix number: “mix 2.mp4”.";

  async function downloadAll() {
    setSaving(true);
    for (const file of files) {
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    setSaving(false);
  }

  return (
    <details className="rounded-card border border-line bg-panel">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
        <span className="min-w-0">
          <span className="block truncate text-lg font-semibold">{name}</span>
          <span className="block text-sm text-mute">
            {rows.length} video{rows.length === 1 ? "" : "s"} · {done} finished
          </span>
        </span>
        <span className="text-xs text-mute">Open</span>
      </summary>
      <div className="space-y-4 border-t border-line px-5 py-4">
        {files.length > 0 ? (
          <button
            type="button"
            onClick={downloadAll}
            disabled={saving}
            className="rounded-xl border border-line px-4 py-2 text-sm font-semibold"
          >
            {saving ? "Saving…" : `Download all ${files.length} clean videos`}
          </button>
        ) : null}
        <ol className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl bg-lift px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/cards/${row.id}?step=${row.stage === "review" ? "live" : "editor"}`} className="font-semibold">
                  {row.mixLabel}
                </Link>
                <span className="text-xs text-mute">{STAGE_LABEL[row.stage]}</span>
              </div>
              {row.words.length > 0 ? (
                <dl className="mt-2 space-y-1 text-sm">
                  {row.words.map((line) => (
                    <div key={line.label} className="flex gap-2">
                      <dt className="w-10 shrink-0 text-mute">{line.label}</dt>
                      <dd className="whitespace-pre-wrap">{line.words}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-2 text-sm text-mute">No words on this one.</p>
              )}
              <p className="mt-2 text-xs text-mute">
                {row.needs.length > 1 ? "Two files: " : ""}
                {row.needs.map((need, index) => (
                  <span key={need.look}>
                    {index > 0 ? " + " : ""}
                    <span className={need.done ? "text-sun" : ""}>
                      {need.tag}
                      {need.done ? " ✓ in" : ""}
                    </span>
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ol>
        {editor || rows.some((row) => row.stage !== "review") ? (
          <DropZone
            action="/api/assets/batch"
            extra={{ cardIds: rows.map((row) => row.id).join(",") }}
            label="Drop the finished videos here"
            hint={`${nameHint} Under ${sizeLabel}.`}
            accept="video/*"
            maxBytes={maxBytes}
          />
        ) : null}
      </div>
    </details>
  );
}
