"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { publicFileUrl } from "@/lib/urls";
import { MAX_HOOK_LOGOS, parseLogos } from "@/lib/hook-logos-math";

export function HookLogos({ id, logosJson }: { id: string; logosJson: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const logos = parseLogos(logosJson);

  async function add(file: File) {
    const body = new FormData();
    body.append("file", file);
    await fetch(`/api/repurpose/clips/${id}/logos`, { method: "POST", body });
    router.refresh();
  }

  async function remove(path: string) {
    await fetch(`/api/repurpose/clips/${id}/logos?path=${encodeURIComponent(path)}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mt-2 space-y-1">
      <p className="text-[11px] text-mute">Logos · first 2.5s. Three files become A + B = $.</p>
      <div className="flex flex-wrap items-center gap-1">
        {logos.map((logo) => (
          <button
            key={logo.path}
            type="button"
            onClick={() => remove(logo.path)}
            className="relative h-10 w-10 overflow-hidden rounded-lg border border-line bg-ink"
            title={`Remove ${logo.filename}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={publicFileUrl(logo.path)} alt={logo.filename} className="h-full w-full object-contain" />
          </button>
        ))}
        {logos.length < MAX_HOOK_LOGOS ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) add(file);
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
      </div>
    </div>
  );
}
