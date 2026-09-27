"use client";

import { useState } from "react";
import { applyCaptionLines, captionLines, parseCaptionWords } from "@/lib/captions-math";

export function SpokenFix({ id, captionsJson }: { id: string; captionsJson: string }) {
  const [stored, setStored] = useState(captionsJson);
  const words = parseCaptionWords(stored);
  const [text, setText] = useState(captionLines(words));

  async function save(next: string) {
    setStored(next);
    await fetch(`/api/repurpose/clips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ captionsJson: next }),
    });
  }

  if (!words.length) {
    return (
      <p className="mt-2 text-[11px] text-mute">
        Spoken words: Generate once with Spoken words on. CapCut-style captions land here so you can fix them, then Generate again.
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <p className="text-[11px] text-mute">Spoken words — one phrase per line. Lower third. Times stay. Wipe to listen again.</p>
      <textarea
        value={text}
        className="field min-h-16 px-2 py-1 text-xs"
        onChange={(event) => setText(event.target.value)}
        onBlur={() => save(JSON.stringify(applyCaptionLines(words, text)))}
      />
      <button
        type="button"
        className="w-full rounded-lg border border-line px-2 py-1 text-[11px] text-mute"
        onClick={() => {
          setText("");
          void save("");
        }}
      >
        Wipe and listen again
      </button>
    </div>
  );
}
