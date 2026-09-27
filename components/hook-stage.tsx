"use client";

import { useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { hookDefaultPos, parseHookLayout, stringifyHookLayout } from "@/lib/hook-layout";
import { parseLogos } from "@/lib/hook-logos-math";
import { publicFileUrl } from "@/lib/urls";
import type { DrawnStyle } from "@/lib/text-style";

export function HookStage({
  id,
  src,
  hookText,
  hookLayout,
  logosJson,
  look,
}: {
  id: string;
  src: string;
  hookText: string;
  hookLayout: string;
  logosJson: string;
  look: DrawnStyle;
}) {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const saved = parseHookLayout(hookLayout) ?? hookDefaultPos(look);
  const [text, setText] = useState(hookText);
  const [pos, setPos] = useState(saved);
  const logos = parseLogos(logosJson);

  function point(event: PointerEvent<HTMLElement>) {
    const box = stageRef.current?.getBoundingClientRect();
    if (!box) return saved;
    return {
      x: Math.min(0.92, Math.max(0.08, (event.clientX - box.left) / box.width)),
      y: Math.min(0.88, Math.max(0.08, (event.clientY - box.top) / box.height)),
    };
  }

  async function saveText(value: string, next = pos) {
    setText(value);
    await fetch(`/api/repurpose/clips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hookText: value, hookLayout: stringifyHookLayout(next) }),
    });
  }

  async function moveLogo(path: string, event: PointerEvent<HTMLButtonElement>) {
    const next = point(event);
    await fetch(`/api/repurpose/clips/${id}/logos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, x: next.x, y: next.y }),
    });
    router.refresh();
  }

  const native =
    look === "instagram"
      ? "rounded-md bg-black/70 px-2 py-1 text-center text-[11px] font-semibold text-white"
      : "text-center text-[11px] font-bold text-white [text-shadow:0_1px_0_#000,0_-1px_0_#000,1px_0_0_#000,-1px_0_0_#000,0_2px_6px_#000]";

  return (
    <div ref={stageRef} className="relative overflow-hidden rounded-xl bg-ink">
      <video src={src} muted playsInline loop autoPlay className="aspect-[9/16] w-full object-cover" />
      <textarea
        value={text}
        placeholder="Type here · drag to place"
        onChange={(event) => setText(event.target.value)}
        onBlur={() => saveText(text)}
        onPointerUp={async (event) => {
          const next = point(event);
          setPos(next);
          await saveText(text, next);
        }}
        className={`absolute z-10 w-[72%] resize-none bg-transparent text-center outline-none ${native}`}
        style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, transform: "translate(-50%, -50%)" }}
        rows={3}
      />
      {logos.map((logo) => (
        <button
          key={logo.path}
          type="button"
          onPointerUp={(event) => moveLogo(logo.path, event)}
          className="absolute z-20 h-12 w-12 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-white/40 bg-ink/40"
          style={{ left: `${(logo.x ?? 0.5) * 100}%`, top: `${(logo.y ?? 0.5) * 100}%` }}
          title="Drag this logo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={publicFileUrl(logo.path)} alt={logo.filename} className="h-full w-full object-contain" />
        </button>
      ))}
    </div>
  );
}
