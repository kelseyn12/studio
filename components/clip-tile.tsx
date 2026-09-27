"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HookLogos } from "@/components/hook-logos";
import { QuickCut } from "@/components/quick-cut";
import { publicFileUrl } from "@/lib/urls";

export function ClipTile({
  id,
  filename,
  path,
  thumbPath,
  hookText,
  postCaption,
  logosJson,
  showHook,
}: {
  id: string;
  filename: string;
  path: string;
  thumbPath: string;
  hookText: string;
  postCaption?: string;
  logosJson?: string;
  showHook: boolean;
}) {
  const router = useRouter();
  const [cutting, setCutting] = useState(false);

  async function remove() {
    await fetch(`/api/repurpose/clips/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function save(field: "hookText" | "postCaption", value: string) {
    await fetch(`/api/repurpose/clips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  return (
    <div className={`${cutting ? "w-64" : showHook ? "w-52" : "w-32"} shrink-0`}>
      {cutting ? (
        <QuickCut src={publicFileUrl(path)} target="clip" id={id} note="Every video made from this clip uses the cut." />
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
      <button
        type="button"
        onClick={() => setCutting(!cutting)}
        className="mt-2 w-full rounded-lg border border-line px-2 py-1 text-xs text-mute"
      >
        {cutting ? "Done cutting" : "Cut"}
      </button>
      {showHook ? (
        <>
          <input
            defaultValue={hookText}
            placeholder="Words on this clip"
            className="field mt-2 px-2 py-1 text-xs"
            onBlur={(event) => save("hookText", event.target.value)}
          />
          <textarea
            defaultValue={postCaption}
            placeholder="Caption that posts under videos from this hook"
            className="field mt-2 min-h-16 px-2 py-1 text-xs"
            onBlur={(event) => save("postCaption", event.target.value)}
          />
          <HookLogos id={id} logosJson={logosJson ?? ""} />
        </>
      ) : (
        <p className="mt-2 truncate text-xs text-mute">{filename}</p>
      )}
    </div>
  );
}
