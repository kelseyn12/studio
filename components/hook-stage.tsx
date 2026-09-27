"use client";

import { useRef, useState, type PointerEvent } from "react";
import { HookList } from "@/components/hook-list";
import { hookDefaultPos, parseHookLayout, stringifyHookLayout, type HookPos } from "@/lib/hook-layout";
import { ALIGN_SNAP, alignLogoRow, clampLogoScale, defaultLogoPos, isLogoFile, itemScale, LOGO_SCALE_STEP, parseLogoItems, snapLogoPos } from "@/lib/hook-logos-math";
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
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const saved = parseHookLayout(hookLayout) ?? hookDefaultPos(look);
  const [text, setText] = useState(hookText);
  const [list, setList] = useState((saved.list ?? []).join("\n"));
  const [pos, setPos] = useState<HookPos>(saved);
  const [preview, setPreview] = useState<DrawnStyle>(look);
  const [places, setPlaces] = useState<Record<string, { x: number; y: number }>>({});
  const [scales, setScales] = useState<Record<string, number>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const logos = parseLogoItems(logosJson);

  function itemKey(item: (typeof logos)[number]): string {
    return isLogoFile(item) ? item.path : item.id;
  }

  function loc(item: (typeof logos)[number], index: number): { x: number; y: number } {
    return places[itemKey(item)] ?? (item.x != null && item.y != null ? { x: item.x, y: item.y } : defaultLogoPos(index, logos.length));
  }

  function scaleOf(item: (typeof logos)[number]): number {
    return scales[itemKey(item)] ?? itemScale(item);
  }

  async function bumpScale(delta: number) {
    const item = logos.find((row) => itemKey(row) === picked) ?? logos[0];
    if (!item) return;
    const next = clampLogoScale(scaleOf(item) + delta);
    setPicked(itemKey(item));
    setScales((current) => ({ ...current, [itemKey(item)]: next }));
    await fetch(`/api/repurpose/clips/${id}/logos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: isLogoFile(item) ? item.path : undefined,
        id: !isLogoFile(item) ? item.id : undefined,
        scale: next,
      }),
    });
  }

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
    const items = lines.split("\n").map((line) => line.trim()).filter(Boolean);
    const packed = { ...next, list: items, listAt: (next.listAt ?? pos.listAt)?.slice(0, items.length) };
    setPos(packed);
    await fetch(`/api/repurpose/clips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hookText: value, hookLayout: stringifyHookLayout(packed) }),
    });
  }

  function shiftItem(item: (typeof logos)[number], event: PointerEvent<HTMLButtonElement>) {
    const raw = point(event);
    const next = snapLogoPos(
      raw.x,
      raw.y,
      logos.flatMap((row, index) => (itemKey(row) === itemKey(item) ? [] : [loc(row, index)])),
    );
    setPlaces((current) => ({ ...current, [itemKey(item)]: next }));
    return next;
  }

  async function alignPieces() {
    const row = alignLogoRow(logos.length, logos[0] ? loc(logos[0], 0).y : undefined);
    const nextPlaces: Record<string, { x: number; y: number }> = {};
    await Promise.all(
      logos.map((item, index) => {
        const at = row[index];
        nextPlaces[itemKey(item)] = at;
        return fetch(`/api/repurpose/clips/${id}/logos`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: isLogoFile(item) ? item.path : undefined,
            id: !isLogoFile(item) ? item.id : undefined,
            x: at.x,
            y: at.y,
          }),
        });
      }),
    );
    setPlaces((current) => ({ ...current, ...nextPlaces }));
    await save({ ...pos, x: 0.5, y: hookDefaultPos(preview).y });
  }

  async function moveItem(item: (typeof logos)[number], event: PointerEvent<HTMLButtonElement>) {
    const next = shiftItem(item, event);
    await fetch(`/api/repurpose/clips/${id}/logos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: isLogoFile(item) ? item.path : undefined,
        id: !isLogoFile(item) ? item.id : undefined,
        x: next.x,
        y: next.y,
      }),
    });
  }

  function revealLine() {
    const items = list.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!items.length) return;
    const at = [...(pos.listAt ?? [])];
    const slot = items.findIndex((_, index) => !Number.isFinite(at[index]));
    at[slot >= 0 ? slot : items.length - 1] = videoRef.current?.currentTime ?? 0;
    void save({ ...pos, listAt: at }, text, list);
  }

  const native =
    preview === "instagram"
      ? "text-center text-[21px] font-semibold leading-tight text-white [text-shadow:0_2px_0_#000,0_-2px_0_#000,2px_0_0_#000,-2px_0_0_#000]"
      : "text-center text-[22px] font-bold leading-tight text-white [text-shadow:0_1px_0_#000,0_-1px_0_#000,1px_0_0_#000,-1px_0_0_#000,0_2px_6px_#000]";

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
        <button type="button" onClick={() => void alignPieces()} className="rounded-lg border border-line px-2 py-1 text-[11px] text-mute">
          Align
        </button>
      </div>
      <div ref={stageRef} className="relative overflow-hidden rounded-xl bg-ink">
        <video ref={videoRef} src={src} controls playsInline className="aspect-[9/16] w-full object-cover" />
        <div
          className="absolute z-10 w-[78%] cursor-grab"
          style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, transform: "translate(-50%, -50%)" }}
          onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
          onPointerMove={(event) => {
            if (event.buttons !== 1) return;
            setPos({ ...point(event), x: Math.abs(point(event).x - 0.5) < ALIGN_SNAP ? 0.5 : point(event).x });
          }}
          onPointerUp={(event) => {
            const next = point(event);
            void save({ ...next, x: Math.abs(next.x - 0.5) < ALIGN_SNAP ? 0.5 : next.x });
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
        {logos.map((item, index) => {
          const at = loc(item, index);
          const scale = scaleOf(item);
          const px = Math.round(48 * scale);
          return (
            <button
              key={itemKey(item)}
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setPicked(itemKey(item));
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (event.buttons !== 1) return;
                event.preventDefault();
                event.stopPropagation();
                shiftItem(item, event);
              }}
              onPointerUp={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void moveItem(item, event);
              }}
              className={`absolute z-30 flex -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none items-center justify-center bg-transparent text-white [text-shadow:0_1px_0_#000,0_-1px_0_#000,1px_0_0_#000,-1px_0_0_#000] active:cursor-grabbing ${picked === itemKey(item) ? "ring-2 ring-white/40" : ""}`}
              style={{ left: `${at.x * 100}%`, top: `${at.y * 100}%`, width: px + 16, height: px + 16, fontSize: Math.round(24 * scale) }}
              title="Drag"
            >
              {isLogoFile(item) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={publicFileUrl(item.path)} alt={item.filename} className="pointer-events-none object-contain" style={{ width: px, height: px }} />
              ) : (
                item.text
              )}
            </button>
          );
        })}
      </div>
      {logos.length ? (
        <div className="flex gap-1">
          <button type="button" onClick={() => bumpScale(-LOGO_SCALE_STEP)} className="flex-1 rounded-lg border border-line px-2 py-1 text-[11px] text-mute">
            Smaller
          </button>
          <button type="button" onClick={() => bumpScale(LOGO_SCALE_STEP)} className="flex-1 rounded-lg border border-line px-2 py-1 text-[11px] text-mute">
            Bigger
          </button>
        </div>
      ) : null}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => save({ ...pos, from: videoRef.current?.currentTime ?? 0 })}
          className="flex-1 rounded-lg border border-line px-2 py-1 text-[11px] text-mute"
        >
          Show text now
        </button>
        <button
          type="button"
          onClick={() => save({ ...pos, to: videoRef.current?.currentTime ?? 0 })}
          className="flex-1 rounded-lg border border-line px-2 py-1 text-[11px] text-mute"
        >
          Hide text after now
        </button>
      </div>
      <p className="text-[11px] text-mute">
        Studio does not hear your list. You set when this text is on screen
        {pos.from != null || pos.to != null
          ? ` (${pos.from?.toFixed(1) ?? "0.0"}s → ${pos.to?.toFixed(1) ?? "end"}).`
          : " (whole clip until you set a window)."}{" "}
        Turn on Spoken words in Mix if you want captions to follow what you say.
      </p>
      <HookList
        list={list}
        listAt={pos.listAt}
        onList={setList}
        onBlur={() => save(pos, text, list)}
        onReveal={revealLine}
      />
    </div>
  );
}
