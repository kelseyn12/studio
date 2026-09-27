"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HookLogos } from "@/components/hook-logos";
import { SpokenFix } from "@/components/spoken-fix";
import { HookStage } from "@/components/hook-stage";
import { QuickCut } from "@/components/quick-cut";
import { spokenOnClip } from "@/lib/captions-math";
import { LOOK_FONT_CLASS } from "@/lib/hook-fonts";
import { boxFor, cutPreviewPath, hookDefaultPos, parseHookLayout, posFor } from "@/lib/hook-layout";
import { boxIsWhite, isBoxed, wordBoxClass } from "@/lib/list-layout";
import { wrapHook, type DrawnStyle } from "@/lib/text-style";
import { publicFileUrl } from "@/lib/urls";

export function ClipTile({
  id,
  filename,
  path,
  thumbPath,
  hookText,
  postCaption,
  logosJson,
  hookLayout,
  captionsJson,
  cutUndo,
  showHook,
  look,
  slot,
  listCount,
  listFromHook,
}: {
  id: string;
  filename: string;
  path: string;
  thumbPath: string;
  hookText: string;
  postCaption?: string;
  logosJson?: string;
  hookLayout?: string;
  captionsJson?: string;
  cutUndo?: string;
  showHook: boolean;
  look?: DrawnStyle;
  slot?: string;
  listCount?: number;
  listFromHook?: { headline: string; x: number; y: number; places?: { tiktok?: { x: number; y: number }; instagram?: { x: number; y: number } } };
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "cut" | "place">("idle");
  const [words, setWords] = useState(hookText);
  const editing = useRef(false);
  const captionRef = useRef(postCaption ?? "");
  const previewLook = look ?? "tiktok";
  const at = posFor(parseHookLayout(hookLayout ?? "") ?? hookDefaultPos(previewLook), previewLook);
  const plate = boxFor(parseHookLayout(hookLayout ?? "") ?? hookDefaultPos(previewLook), previewLook);
  const lines = wrapHook(words);

  useEffect(() => {
    if (!editing.current) setWords(hookText);
  }, [hookText]);

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
    <div className={`${mode === "place" ? "w-96" : mode === "cut" ? "w-64" : "w-52"} shrink-0`}>
      {mode === "cut" ? (
        <QuickCut
          src={publicFileUrl(cutPreviewPath(path, cutUndo))}
          target="clip"
          id={id}
          canUndo={Boolean(cutUndo)}
          note="Save cut, then you will see the short clip. Every video from this clip uses it."
        />
      ) : mode === "place" ? (
        <HookStage
          id={id}
          src={publicFileUrl(path)}
          hookText={words}
          onText={setWords}
          hookLayout={hookLayout ?? ""}
          logosJson={logosJson ?? ""}
          look={look ?? "tiktok"}
          slot={slot}
          listCount={listCount}
          listFromHook={listFromHook}
        />
      ) : (
        <div className="relative overflow-hidden rounded-xl bg-ink">
          {thumbPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={publicFileUrl(thumbPath)} alt={filename} className="aspect-[9/16] w-full object-cover" />
          ) : (
            <div className="flex aspect-[9/16] items-center justify-center text-xs text-mute">{filename}</div>
          )}
          <button type="button" onClick={remove} className="absolute right-1 top-1 z-20 rounded-full bg-ink/80 px-2 text-xs">
            ×
          </button>
          {lines.length ? (
            <div
              className={`pointer-events-none absolute z-10 w-max max-w-[94%] -translate-x-1/2 -translate-y-1/2 text-center text-[11px] font-bold ${LOOK_FONT_CLASS[previewLook]} ${isBoxed(plate) ? `${boxIsWhite(plate) ? "text-black" : "text-white"} ${wordBoxClass(previewLook, plate)}` : "text-white stroke-tt leading-snug"}`}
              style={{ left: `${at.x * 100}%`, top: `${at.y * 100}%` }}
            >
              {lines.map((line, index) => (
                <div key={`${index}-${line}`}>{line}</div>
              ))}
            </div>
          ) : null}
        </div>
      )}
      <div className="mt-2 flex gap-1">
        <button
          type="button"
          onClick={() => {
            void saveCaption(captionRef.current);
            if (mode === "cut") router.refresh();
            setMode(mode === "cut" ? "idle" : "cut");
          }}
          className="flex-1 rounded-lg border border-line px-2 py-1 text-xs text-mute"
        >
          {mode === "cut" ? "Done" : "Cut"}
        </button>
        <button
          type="button"
          onClick={() => {
            void saveCaption(captionRef.current);
            editing.current = mode !== "place";
            setMode(mode === "place" ? "idle" : "place");
          }}
          className="flex-1 rounded-lg border border-line px-2 py-1 text-xs text-mute"
        >
          {mode === "place" ? "Done" : "Words"}
        </button>
      </div>
      {showHook ? (
        <textarea
          defaultValue={postCaption}
          placeholder="Caption that posts under videos from this hook"
          className="field mt-2 min-h-16 px-2 py-1 text-xs"
          onChange={(event) => {
            captionRef.current = event.target.value;
          }}
          onBlur={(event) => saveCaption(event.target.value)}
        />
      ) : (
        <p className="mt-2 truncate text-xs text-mute">{filename}</p>
      )}
      {spokenOnClip(slot) ? <SpokenFix id={id} captionsJson={captionsJson ?? ""} /> : null}
      <HookLogos id={id} logosJson={logosJson ?? ""} hookLayout={hookLayout ?? ""} />
    </div>
  );
}
