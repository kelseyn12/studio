"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { parseHookLayout, stringifyHookLayout } from "@/lib/hook-layout";
import { publicFileUrl } from "@/lib/urls";
import { MAX_HOOK_LOGOS, parseLogos } from "@/lib/hook-logos-math";

export function HookLogos({ id, logosJson, hookLayout }: { id: string; logosJson: string; hookLayout: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const logos = parseLogos(logosJson);
  const layout = parseHookLayout(hookLayout);

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

  async function toggleEquation() {
    const next = { ...(layout ?? { x: 0.5, y: 0.17 }), logoEq: !layout?.logoEq };
    await fetch(`/api/repurpose/clips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hookLayout: stringifyHookLayout(next) }),
    });
    router.refresh();
  }

  return (
    <div className="mt-2 space-y-1">
      <p className="text-[11px] text-mute">Logos · first 2.5s. Drag on Words. Three sit in a row unless you pick A + B = C.</p>
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
        {logos.length === 3 ? (
          <button
            type="button"
            onClick={toggleEquation}
            className={`rounded-lg px-2 py-1 text-[11px] ${layout?.logoEq ? "bg-sun font-semibold text-ink" : "border border-line text-mute"}`}
          >
            A + B = C
          </button>
        ) : null}
      </div>
    </div>
  );
}
