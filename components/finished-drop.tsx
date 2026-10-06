"use client";

import { useState } from "react";
import { DropZone } from "@/components/drop-zone";

const CHOICES = [
  { id: "instagram", label: "IG · FB" },
  { id: "tiktok", label: "TT · YT" },
  { id: "plain", label: "One video" },
] as const;

type Look = (typeof CHOICES)[number]["id"];

function dropLabel(look: Look): string {
  if (look === "tiktok") return "Drop the TT · YT video";
  if (look === "instagram") return "Drop the IG · FB video";
  return "Drop the finished video";
}

export function FinishedDrop({
  cardId,
  look,
  defaultLook = "instagram",
  maxBytes,
  sizeLabel,
}: {
  cardId: string;
  /** Set when this box is only for one look, such as the missing TT · YT file. */
  look?: Look;
  defaultLook?: Look;
  maxBytes: number;
  sizeLabel: string;
}) {
  const [picked, setPicked] = useState<Look>(look ?? defaultLook);
  return (
    <div className="space-y-2">
      {look ? null : (
        <div className="flex flex-wrap gap-2">
          <p className="w-full text-xs text-mute">
            Which video is this? Leave One video selected. IG · FB and TT · YT are only when you export two versions.
          </p>
          {CHOICES.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => setPicked(choice.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                picked === choice.id ? "bg-sun text-ink" : "border border-line text-paper"
              }`}
            >
              {choice.label}
            </button>
          ))}
        </div>
      )}
      <DropZone
        key={picked}
        action="/api/assets"
        extra={{ id: cardId, kind: "EDITED", textStyle: picked }}
        label={dropLabel(picked)}
        hint={`The export that posts. Under ${sizeLabel}.`}
        accept="video/*"
        maxBytes={maxBytes}
      />
    </div>
  );
}
