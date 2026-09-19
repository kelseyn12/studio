"use client";

import { useRouter } from "next/navigation";
import { publicFileUrl } from "@/lib/urls";

export function ClipTile({
  id,
  filename,
  thumbPath,
  hookText,
  showHook,
}: {
  id: string;
  filename: string;
  thumbPath: string;
  hookText: string;
  showHook: boolean;
}) {
  const router = useRouter();

  async function remove() {
    await fetch(`/api/repurpose/clips/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function saveHook(value: string) {
    await fetch(`/api/repurpose/clips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hookText: value }),
    });
  }

  return (
    <div className="w-32 shrink-0">
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
      {showHook ? (
        <input
          defaultValue={hookText}
          placeholder="Hook text"
          className="field mt-2 px-2 py-1 text-xs"
          onBlur={(event) => saveHook(event.target.value)}
        />
      ) : (
        <p className="mt-2 truncate text-xs text-mute">{filename}</p>
      )}
    </div>
  );
}
