"use client";

import { useState } from "react";
import { MAX_REFERENCES, type ReferenceLink } from "@/lib/references";

/** Link plus what to copy from it. Blank rows are dropped on save. */
export function ReferenceLinks({ links }: { links: ReferenceLink[] }) {
  const [rows, setRows] = useState<ReferenceLink[]>(links.length ? links : [{ url: "", note: "" }]);

  function update(index: number, patch: Partial<ReferenceLink>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-mute">Reference links. Under each one, say what to copy.</p>
      {rows.map((row, index) => (
        <div key={index} className="space-y-2 rounded-xl border border-line p-3">
          <input
            name="referenceUrl"
            value={row.url}
            placeholder="Reference link"
            onChange={(event) => update(index, { url: event.target.value })}
            className="field"
          />
          <textarea
            name="referenceNote"
            value={row.note}
            placeholder="What to copy — the hook, the captions, the pacing"
            onChange={(event) => update(index, { note: event.target.value })}
            className="field min-h-16"
          />
          {rows.length > 1 ? (
            <button
              type="button"
              onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
              className="text-sm text-mute"
            >
              Remove
            </button>
          ) : null}
        </div>
      ))}
      {rows.length < MAX_REFERENCES ? (
        <button
          type="button"
          onClick={() => setRows((current) => [...current, { url: "", note: "" }])}
          className="text-sm text-mute"
        >
          Add another reference
        </button>
      ) : null}
    </div>
  );
}
