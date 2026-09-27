"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { publicFileUrl } from "@/lib/urls";
import { isLogoFile, MAX_HOOK_LOGOS, MAX_LOGO_ITEMS, parseLogoItems } from "@/lib/hook-logos-math";

export function HookLogos({ id, logosJson }: { id: string; logosJson: string; hookLayout?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mark, setMark] = useState("");
  const items = parseLogoItems(logosJson);
  const files = items.filter(isLogoFile);

  async function addFile(file: File) {
    const body = new FormData();
    body.append("file", file);
    await fetch(`/api/repurpose/clips/${id}/logos`, { method: "POST", body });
    router.refresh();
  }

  async function addMark(text: string) {
    const value = text.trim();
    if (!value) return;
    await fetch(`/api/repurpose/clips/${id}/logos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark: value }),
    });
    setMark("");
    router.refresh();
  }

  async function remove(item: (typeof items)[number]) {
    const query = isLogoFile(item) ? `path=${encodeURIComponent(item.path)}` : `id=${encodeURIComponent(item.id)}`;
    await fetch(`/api/repurpose/clips/${id}/logos?${query}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mt-2 space-y-1">
      <p className="text-[11px] text-mute">
        First seconds: logos, +, =, emoji, or a short line. Open Words — chips sit in a row up top, white border, drag those. Headline is Words.
      </p>
      <div className="flex flex-wrap items-center gap-1">
        {items.map((item) => (
          <button
            key={isLogoFile(item) ? item.path : item.id}
            type="button"
            onClick={() => remove(item)}
            className="relative flex h-10 min-w-10 items-center justify-center overflow-hidden rounded-lg border border-line bg-ink px-1 text-xs"
            title="Remove"
          >
            {isLogoFile(item) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={publicFileUrl(item.path)} alt={item.filename} className="h-full w-full object-contain" />
            ) : (
              item.text
            )}
          </button>
        ))}
        {files.length < MAX_HOOK_LOGOS && items.length < MAX_LOGO_ITEMS ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) addFile(file);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-dashed border-line px-2 py-1 text-[11px] text-mute"
            >
              Add logo
            </button>
          </>
        ) : null}
        {items.length < MAX_LOGO_ITEMS ? (
          <>
            {["+", "=", "🔥"].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => addMark(chip)}
                className="rounded-lg border border-line px-2 py-1 text-[11px] text-mute"
              >
                {chip}
              </button>
            ))}
            <input
              value={mark}
              onChange={(event) => setMark(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void addMark(mark);
                }
              }}
              placeholder="emoji or word"
              className="field h-8 w-24 px-2 text-[11px]"
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
