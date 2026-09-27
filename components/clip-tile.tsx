"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HookLogos } from "@/components/hook-logos";
import { HookStage } from "@/components/hook-stage";
import { QuickCut } from "@/components/quick-cut";
import { publicFileUrl } from "@/lib/urls";
import type { DrawnStyle } from "@/lib/text-style";

export function ClipTile({
  id,
  filename,
  path,
  thumbPath,
  hookText,
  postCaption,
  logosJson,
  hookLayout,
  cutUndo,
  showHook,
  look,
}: {
  id: string;
  filename: string;
  path: string;
  thumbPath: string;
  hookText: string;
  postCaption?: string;
  logosJson?: string;
  hookLayout?: string;
  cutUndo?: string;
  showHook: boolean;
  look?: DrawnStyle;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "cut" | "place">("idle");

  async function remove() {
    await fetch(`/api/repurpose/clips/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function saveCaption(value: string) {
    await fetch(`/api/repurpose/clips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postCaption: value }),
    });
  }

  return (
    <div className={`${mode !== "idle" ? "w-64" : showHook ? "w-52" : "w-32"} shrink-0`}>
      {mode === "cut" ? (
        <QuickCut
          src={publicFileUrl(path)}
          target="clip"
          id={id}
          canUndo={Boolean(cutUndo)}
          note="Every video made from this clip uses the cut."
        />
      ) : mode === "place" ? (
        <HookStage
          id={id}
          src={publicFileUrl(path)}
          hookText={hookText}
          hookLayout={hookLayout ?? ""}
          logosJson={logosJson ?? ""}
          look={look ?? "tiktok"}
        />
      ) : (
        <div className="relative overflow-hidden rounded-xl bg-ink">
          {thumbPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={publicFileUrl(thumbPath)} alt={filename} className="aspect-[9/16] w-full object-cover" />
          ) : (
            <div className="flex aspect-[9/16] items-center justify-center text-xs text-mute">{filename}</div>
          )}
          <button type="button" onClick={remove} className="absolute right-1 top-1 rounded-full bg-ink/80 px-2 text-xs">
            ×
          </button>
        </div>
      )}
      {showHook ? (
        <div className="mt-2 flex gap-1">
          <button
            type="button"
            onClick={() => {
              if (mode === "cut") router.refresh();
              setMode(mode === "cut" ? "idle" : "cut");
            }}
            className="flex-1 rounded-lg border border-line px-2 py-1 text-xs text-mute"
          >
            {mode === "cut" ? "Done" : "Cut"}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "place" ? "idle" : "place")}
            className="flex-1 rounded-lg border border-line px-2 py-1 text-xs text-mute"
          >
            {mode === "place" ? "Done" : "Words"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (mode === "cut") router.refresh();
            setMode(mode === "cut" ? "idle" : "cut");
          }}
          className="mt-2 w-full rounded-lg border border-line px-2 py-1 text-xs text-mute"
        >
          {mode === "cut" ? "Done cutting" : "Cut"}
        </button>
      )}
      {showHook ? (
        <>
          <textarea
            defaultValue={postCaption}
            placeholder="Caption that posts under videos from this hook"
            className="field mt-2 min-h-16 px-2 py-1 text-xs"
            onBlur={(event) => saveCaption(event.target.value)}
          />
          <HookLogos id={id} logosJson={logosJson ?? ""} />
        </>
      ) : (
        <p className="mt-2 truncate text-xs text-mute">{filename}</p>
      )}
    </div>
  );
}
