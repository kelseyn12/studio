export const LOGO_SECONDS = 2.5;
export const MAX_HOOK_LOGOS = 4;
export const CANVAS_W = 1080;
export const CANVAS_H = 1920;

export type HookLogo = { path: string; filename: string; x?: number; y?: number };
export type LogoBox =
  | { kind: "logo"; index: number; x: number; y: number; w: number; h: number }
  | { kind: "mark"; text: string; x: number; y: number; size: number };

function fileName(pathValue: string): string {
  const parts = pathValue.split("/");
  return parts[parts.length - 1] || pathValue;
}

export function parseLogos(raw: string | null | undefined): HookLogo[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const pathValue = String((item as HookLogo).path || "").replace(/\\/g, "/");
        const filename = String((item as HookLogo).filename || "").trim();
        if (!pathValue || pathValue.includes("..") || pathValue.startsWith("/")) return [];
        const x = Number((item as HookLogo).x);
        const y = Number((item as HookLogo).y);
        const placed = Number.isFinite(x) && Number.isFinite(y);
        return [
          {
            path: pathValue,
            filename: filename || fileName(pathValue),
            ...(placed ? { x: Math.min(0.92, Math.max(0.08, x)), y: Math.min(0.88, Math.max(0.08, y)) } : {}),
          },
        ];
      })
      .slice(0, MAX_HOOK_LOGOS);
  } catch {
    return [];
  }
}

export function stringifyLogos(logos: HookLogo[]): string {
  return JSON.stringify(logos.slice(0, MAX_HOOK_LOGOS));
}

function centerY(size: number): number {
  return Math.round((CANVAS_H - size) / 2);
}

/** 1 centered, 2–4 in a row. Pass equation for the optional A + B = C layout. */
export function logoBoxes(count: number, equation = false): LogoBox[] {
  if (count < 1 || count > MAX_HOOK_LOGOS) return [];
  if (count === 1) {
    const size = 360;
    return [{ kind: "logo", index: 0, x: Math.round((CANVAS_W - size) / 2), y: centerY(size), w: size, h: size }];
  }
  if (count === 3 && equation) {
    const size = 240;
    const mark = 96;
    const gap = 20;
    const total = size * 3 + mark * 2 + gap * 4;
    let x = Math.round((CANVAS_W - total) / 2);
    const boxes: LogoBox[] = [];
    const addLogo = (index: number) => {
      boxes.push({ kind: "logo", index, x, y: centerY(size), w: size, h: size });
      x += size + gap;
    };
    const addMark = (text: string) => {
      boxes.push({ kind: "mark", text, x, y: centerY(size) + Math.round((size - mark) / 2), size: mark });
      x += mark + gap;
    };
    addLogo(0);
    addMark("+");
    addLogo(1);
    addMark("=");
    addLogo(2);
    return boxes;
  }
  const size = count === 2 ? 280 : 180;
  const gap = 28;
  const total = size * count + gap * (count - 1);
  let x = Math.round((CANVAS_W - total) / 2);
  return Array.from({ length: count }, (_, index) => {
    const box: LogoBox = { kind: "logo", index, x, y: centerY(size), w: size, h: size };
    x += size + gap;
    return box;
  });
}

export function placeLogoBoxes(boxes: LogoBox[], places: Array<{ x?: number; y?: number }>): LogoBox[] {
  const next = boxes.map((box) => {
    if (box.kind !== "logo") return { ...box };
    const place = places[box.index];
    if (place?.x == null || place?.y == null || !Number.isFinite(place.x) || !Number.isFinite(place.y)) return { ...box };
    return {
      ...box,
      x: Math.round(place.x * CANVAS_W - box.w / 2),
      y: Math.round(place.y * CANVAS_H - box.h / 2),
    };
  });
  const logos = next.filter((box): box is Extract<LogoBox, { kind: "logo" }> => box.kind === "logo");
  const marks = next.filter((box): box is Extract<LogoBox, { kind: "mark" }> => box.kind === "mark");
  if (logos.length === 3 && marks.length === 2) {
    const mid = (left: (typeof logos)[0], right: (typeof logos)[0], mark: (typeof marks)[0]) => {
      mark.x = Math.round((left.x + left.w + right.x) / 2 - mark.size / 2);
      mark.y = Math.round((left.y + right.y) / 2 + (left.h - mark.size) / 4);
    };
    mid(logos[0], logos[1], marks[0]);
    mid(logos[1], logos[2], marks[1]);
  }
  return next;
}

export function logoOverlayFilter(baseLabel: string, logoLabel: string, outLabel: string): string {
  return `[${baseLabel}][${logoLabel}]overlay=0:0:enable='lte(t,${LOGO_SECONDS})'[${outLabel}]`;
}
