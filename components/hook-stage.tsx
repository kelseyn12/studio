"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { AlignGuides } from "@/components/align-guides";
import { HookList } from "@/components/hook-list";
import { ListOverlay } from "@/components/list-overlay";
import { boxFor, boxLabel, hookDefaultPos, nextBox, parseHookLayout, posFor, setLookBox, setLookPos, stringifyHookLayout, type HookPos } from "@/lib/hook-layout";
import { LogoScaleBar } from "@/components/logo-scale-bar";
import { ALIGN_SNAP, clampLogoScale, defaultLogoPos, isLogoFile, itemScale, LOGO_SCALE_STEP, matchTypeScale, parseLogoItems, previewGrab, sharedAxes, snapLogoPos } from "@/lib/hook-logos-math";
import { LOOK_FONT_CLASS } from "@/lib/hook-fonts";
import { boxIsWhite, isBoxed, listRows, listStack, wordBoxClass } from "@/lib/list-layout";
import { publicFileUrl } from "@/lib/urls";
import type { DrawnStyle } from "@/lib/text-style";

export function HookStage({
  id,
  src,
  hookText,
  hookLayout,
  logosJson,
  look,
  slot,
  listCount = 0,
  listFromHook,
  onText,
  onLayout,
  onLogos,
}: {
  id: string;
  src: string;
  hookText: string;
  hookLayout: string;
  logosJson: string;
  look: DrawnStyle;
  slot?: string;
  listCount?: number;
  listFromHook?: { headline: string; x: number; y: number; places?: HookPos["places"] };
  onText?: (value: string) => void;
  onLayout?: (value: string) => void;
  onLogos?: (items: ReturnType<typeof parseLogoItems>) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const typeRef = useRef<HTMLTextAreaElement>(null);
  const saved = parseHookLayout(hookLayout) ?? hookDefaultPos(look);
  const [text, setText] = useState(hookText);
  const [list, setList] = useState((saved.list ?? []).join("\n"));
  const [pos, setPos] = useState<HookPos>(saved);
  const draft = useRef({ text: hookText, pos: saved, list: (saved.list ?? []).join("\n") });
  draft.current = { text, pos, list };
  const [preview, setPreview] = useState<DrawnStyle>(look);
  const [places, setPlaces] = useState<Record<string, { x: number; y: number }>>({});
  const [scales, setScales] = useState<Record<string, number>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [guides, setGuides] = useState(true);
  const logos = parseLogoItems(logosJson);
  const onLayoutRef = useRef(onLayout);
  const onLogosRef = useRef(onLogos);
  onLayoutRef.current = onLayout;
  onLogosRef.current = onLogos;

  function itemKey(item: (typeof logos)[number]): string {
    return isLogoFile(item) ? item.path : item.id;
  }

  function loc(item: (typeof logos)[number], index: number): { x: number; y: number } {
    return places[itemKey(item)] ?? (item.x != null && item.y != null ? { x: item.x, y: item.y } : defaultLogoPos(index, logos.length));
  }

  function scaleOf(item: (typeof logos)[number]): number {
    return scales[itemKey(item)] ?? itemScale(item);
  }

  async function setScale(next: number) {
    const item = logos.find((row) => itemKey(row) === picked) ?? logos[0];
    if (!item) return;
    const scale = clampLogoScale(next);
    setPicked(itemKey(item));
    setScales((current) => ({ ...current, [itemKey(item)]: scale }));
    await fetch(`/api/repurpose/clips/${id}/logos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: isLogoFile(item) ? item.path : undefined,
        id: !isLogoFile(item) ? item.id : undefined,
        scale,
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

  function dragged(event: PointerEvent<HTMLElement>): HookPos {
    const raw = point(event);
    const x = Math.abs(raw.x - 0.5) < ALIGN_SNAP ? 0.5 : raw.x;
    return setLookPos(pos, preview, x, raw.y);
  }

  async function save(next: HookPos, value = text, lines = list) {
    const items = lines.split("\n").map((line) => line.trim()).filter(Boolean);
    const packed = { ...next, list: items, listAt: (next.listAt ?? pos.listAt)?.slice(0, items.length) };
    setPos(packed);
    await fetch(`/api/repurpose/clips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hookText: value, hookLayout: stringifyHookLayout(packed) }),
      keepalive: true,
    });
  }

  useEffect(() => {
    const items = list.split("\n").map((line) => line.trim()).filter(Boolean);
    onLayoutRef.current?.(stringifyHookLayout({ ...pos, list: items, listAt: (pos.listAt ?? []).slice(0, items.length) }));
  }, [list, pos]);

  useEffect(() => {
    onLogosRef.current?.(
      logos.map((item, index) => {
        const at = places[itemKey(item)] ?? (item.x != null && item.y != null ? { x: item.x, y: item.y } : defaultLogoPos(index, logos.length));
        const scale = scales[itemKey(item)] ?? itemScale(item);
        return { ...item, x: at.x, y: at.y, scale };
      }),
    );
  }, [logosJson, places, scales]);

  useEffect(() => {
    return () => {
      const latest = draft.current;
      const items = latest.list.split("\n").map((line) => line.trim()).filter(Boolean);
      const packed = { ...latest.pos, list: items, listAt: (latest.pos.listAt ?? []).slice(0, items.length) };
      void fetch(`/api/repurpose/clips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hookText: latest.text, hookLayout: stringifyHookLayout(packed) }),
        keepalive: true,
      });
    };
  }, [id]);

  function shiftItem(item: (typeof logos)[number], event: PointerEvent<HTMLButtonElement>) {
    const raw = point(event);
    const next = snapLogoPos(raw.x, raw.y, [
      { x: 0.5, y: posFor(pos, preview).y },
      ...logos.flatMap((row, index) => (itemKey(row) === itemKey(item) ? [] : [loc(row, index)])),
    ]);
    setPlaces((current) => ({ ...current, [itemKey(item)]: next }));
    return next;
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

  const lines = list.split("\n").map((line) => line.trim()).filter(Boolean);
  const count = Math.max(listCount, lines.length);
  const onHook = slot === "HOOK" || !listFromHook;
  const at = posFor(pos, preview);
  const anchor = onHook || !listFromHook ? at : posFor(listFromHook, preview);
  const stack = listStack({
    style: preview,
    headline: onHook ? text : listFromHook.headline,
    x: anchor.x,
    y: anchor.y,
    count,
  });
  const typeSize = `${LOOK_FONT_CLASS[preview]} ${preview === "instagram" ? "text-[26px] font-bold leading-snug" : "text-[20px] font-bold leading-snug"}`;
  const lookBox = boxFor(pos, preview);
  const boxed = isBoxed(lookBox);
  const inkClass = boxed && boxIsWhite(lookBox) ? "text-black" : "text-white";
  const plate = wordBoxClass(preview, lookBox);
  const stroke = boxed ? "" : preview === "instagram" ? "stroke-ig" : "stroke-tt";

  useEffect(() => {
    const node = typeRef.current;
    if (!node) return;
    node.style.height = "0px";
    node.style.height = `${node.scrollHeight}px`;
  }, [text, preview, boxed]);
  const active = logos.find((row) => itemKey(row) === picked) ?? logos[0];
  const axes = sharedAxes([{ x: at.x, y: at.y }, ...logos.map((item, index) => loc(item, index))]);

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
        <button
          type="button"
          onClick={() => setGuides((on) => !on)}
          className={`rounded-lg px-2 py-1 text-[11px] ${guides ? "bg-sun font-semibold text-ink" : "border border-line text-mute"}`}
        >
          Align
        </button>
        <button
          type="button"
          onClick={() => preview !== "instagram" && void save(setLookBox(pos, preview, nextBox(lookBox)))}
          className={`rounded-lg px-2 py-1 text-[11px] ${boxed ? "bg-sun font-semibold text-ink" : "border border-line text-mute"}`}
        >
          {preview === "instagram" ? "IG font" : boxLabel(lookBox, preview)}
        </button>
      </div>
      <div ref={stageRef} className="relative overflow-hidden rounded-xl bg-ink">
        <video ref={videoRef} src={src} controls playsInline className="aspect-[9/16] w-full object-cover" />
        {guides ? <AlignGuides horizontals={[at.y, ...axes.ys]} verticals={axes.xs} /> : null}
        <div
          className="absolute z-10 w-max max-w-[94%] cursor-grab"
          style={{ left: `${at.x * 100}%`, top: `${at.y * 100}%`, transform: "translate(-50%, -50%)" }}
          onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
          onPointerMove={(event) => {
            if (event.buttons !== 1) return;
            setPos(dragged(event));
          }}
          onPointerUp={(event) => void save(dragged(event))}
        >
          <p className="mb-1 text-center text-[10px] text-white/70">Drag</p>
          <textarea
            ref={typeRef}
            value={text}
            placeholder="Type here"
            onChange={(event) => {
              draft.current.text = event.target.value;
              setText(event.target.value);
              onText?.(event.target.value);
            }}
            onBlur={(event) => save(draft.current.pos, event.target.value, draft.current.list)}
            onPointerDown={(event) => event.stopPropagation()}
            rows={2}
            className={`block w-full resize-none overflow-hidden bg-transparent text-center outline-none [field-sizing:content] ${typeSize} ${
              boxed ? `${inkClass} ${plate}` : `text-white ${stroke}`
            } ${boxed && boxIsWhite(lookBox) ? "caret-black" : "caret-white"}`}
          />
        </div>
        {count ? (
          <ListOverlay
            rows={listRows(stack, count)}
            lines={lines}
            className={`${typeSize} ${boxed ? `${inkClass} ${plate} w-fit` : `text-white ${stroke}`}`}
          />
        ) : null}
        {logos.map((item, index) => {
          const at = loc(item, index);
          const scale = scaleOf(item);
          const grab = previewGrab(preview, item, scale);
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
              className={`absolute z-30 flex -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none items-center justify-center overflow-hidden bg-transparent p-0 leading-none text-white [text-shadow:0_1px_0_#000,0_-1px_0_#000,1px_0_0_#000,-1px_0_0_#000] active:cursor-grabbing ${picked === itemKey(item) ? "ring-2 ring-white/40" : ""}`}
              style={{ left: `${at.x * 100}%`, top: `${at.y * 100}%`, width: grab.width, height: grab.height, fontSize: grab.fontSize || undefined }}
              title="Drag"
            >
              {isLogoFile(item) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={publicFileUrl(item.path)} alt={item.filename} className="pointer-events-none object-contain" style={{ width: grab.width, height: grab.height }} />
              ) : (
                item.text
              )}
            </button>
          );
        })}
      </div>
      {logos.length ? (
        <LogoScaleBar
          onSmaller={() => active && void setScale(scaleOf(active) - LOGO_SCALE_STEP)}
          onMatch={() => void setScale(matchTypeScale(preview, logos.filter(isLogoFile).length))}
          onBigger={() => active && void setScale(scaleOf(active) + LOGO_SCALE_STEP)}
        />
      ) : null}
      <div className="flex gap-1">
        <button type="button" onClick={() => save({ ...pos, from: videoRef.current?.currentTime ?? 0 })} className="flex-1 rounded-lg border border-line px-2 py-1 text-[11px] text-mute">
          Show text now
        </button>
        <button type="button" onClick={() => save({ ...pos, to: videoRef.current?.currentTime ?? 0 })} className="flex-1 rounded-lg border border-line px-2 py-1 text-[11px] text-mute">
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
