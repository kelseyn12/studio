"use client";

import { useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { hookDefaultPos, parseHookLayout, stringifyHookLayout, type HookPos } from "@/lib/hook-layout";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const saved = parseHookLayout(hookLayout) ?? hookDefaultPos(look);
  const [text, setText] = useState(hookText);
  const [list, setList] = useState((saved.list ?? []).join("\n"));
  const [pos, setPos] = useState<HookPos>(saved);
  const [preview, setPreview] = useState<DrawnStyle>(look);
  const logos = parseLogos(logosJson);

  function point(event: PointerEvent<HTMLElement>): HookPos {
    const box = stageRef.current?.getBoundingClientRect();
    if (!box) return pos;
    return {
      ...pos,
      x: Math.min(0.92, Math.max(0.08, (event.clientX - box.left) / box.width)),
      y: Math.min(0.88, Math.max(0.08, (event.clientY - box.top) / box.height)),
    };
  }

  async function save(next: HookPos, value = text, lines = list) {
    const packed = { ...next, list: lines.split("\n").map((line) => line.trim()).filter(Boolean) };
    setPos(packed);
    await fetch(`/api/repurpose/clips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hookText: value, hookLayout: stringifyHookLayout(packed) }),
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
    preview === "instagram"
      ? "rounded-md bg-black/70 px-2 py-1 text-center text-[13px] font-semibold leading-tight text-white"
      : "text-center text-[13px] font-bold leading-tight text-white [text-shadow:0_1px_0_#000,0_-1px_0_#000,1px_0_0_#000,-1px_0_0_#000,0_2px_6px_#000]";

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {(["tiktok", "instagram"] as const).map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => setPreview(choice)}
            className={`rounded-lg px-2 py-1 text-[11px] ${preview === choice ? "bg-sun font-semibold text-ink" : "border border-line text-mute"}`}
          >
            {choice === "tiktok" ? "TT size" : "IG size"}
          </button>
        ))}
      </div>
      <div ref={stageRef} className="relative overflow-hidden rounded-xl bg-ink">
        <video ref={videoRef} src={src} controls playsInline className="aspect-[9/16] w-full object-cover" />
        <div
          className="absolute z-10 w-[78%] cursor-grab"
          style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, transform: "translate(-50%, -50%)" }}
          onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
          onPointerMove={(event) => {
            if (event.buttons !== 1) return;
            setPos(point(event));
          }}
          onPointerUp={(event) => {
            void save(point(event));
          }}
        >
          <p className="mb-1 text-center text-[10px] text-white/70">Drag</p>
          <textarea
            value={text}
            placeholder="Type here"
            onChange={(event) => setText(event.target.value)}
            onBlur={() => save(pos, text)}
            onPointerDown={(event) => event.stopPropagation()}
            className={`w-full resize-none bg-transparent outline-none ${native}`}
            rows={3}
          />
        </div>
        {logos.map((logo) => (
          <button
            key={logo.path}
            type="button"
            onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
            onPointerMove={(event) => {
              if (event.buttons !== 1) return;
              const next = point(event);
              event.currentTarget.style.left = `${next.x * 100}%`;
              event.currentTarget.style.top = `${next.y * 100}%`;
            }}
            onPointerUp={(event) => moveLogo(logo.path, event)}
            className="absolute z-20 h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-grab overflow-hidden rounded-lg border border-white/40 bg-ink/40"
            style={{ left: `${(logo.x ?? 0.5) * 100}%`, top: `${(logo.y ?? 0.5) * 100}%` }}
            title="Drag this logo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={publicFileUrl(logo.path)} alt={logo.filename} className="h-full w-full object-contain" />
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => save({ ...pos, from: videoRef.current?.currentTime ?? 0 })}
          className="flex-1 rounded-lg border border-line px-2 py-1 text-[11px] text-mute"
        >
          Words from here
        </button>
        <button
          type="button"
          onClick={() => save({ ...pos, to: videoRef.current?.currentTime ?? 0 })}
          className="flex-1 rounded-lg border border-line px-2 py-1 text-[11px] text-mute"
        >
          Words to here
        </button>
      </div>
      <p className="text-[11px] text-mute">
        {pos.from != null || pos.to != null
          ? `On screen ${pos.from?.toFixed(1) ?? "0.0"}s → ${pos.to?.toFixed(1) ?? "end"}`
          : "Whole clip. Scrub, then Words from / to here."}
      </p>
      <textarea
        value={list}
        placeholder={"List under the headline\none point per line\nYour birthday month"}
        className="field min-h-16 px-2 py-1 text-xs"
        onChange={(event) => setList(event.target.value)}
        onBlur={() => save(pos, text, list)}
      />
    </div>
  );
}
