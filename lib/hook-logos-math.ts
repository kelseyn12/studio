export const LOGO_SECONDS = 4;
export const MAX_HOOK_LOGOS = 4;
export const MAX_LOGO_ITEMS = 8;
export const CANVAS_W = 1080;
export const CANVAS_H = 1920;
/** Above the headline / play button so new chips are grabable. */
export const LOGO_ROW_Y = 0.15;

export function defaultLogoPos(index: number, count: number): { x: number; y: number } {
  const n = Math.max(1, count);
  const x = n <= 1 ? 0.5 : 0.16 + (0.68 * index) / (n - 1);
  return { x: Math.min(0.92, Math.max(0.08, x)), y: LOGO_ROW_Y };
}

export const ALIGN_SNAP = 0.03;

export function alignLogoRow(count: number, y = LOGO_ROW_Y): Array<{ x: number; y: number }> {
  return Array.from({ length: Math.max(0, count) }, (_, index) => ({
    x: defaultLogoPos(index, count).x,
    y: Math.min(0.88, Math.max(0.08, y)),
  }));
}

export function snapLogoPos(
  x: number,
  y: number,
  others: Array<{ x: number; y: number }>,
): { x: number; y: number } {
  let nextX = x;
  let nextY = y;
  for (const other of others) {
    if (Math.abs(other.y - y) < ALIGN_SNAP) nextY = other.y;
    if (Math.abs(other.x - x) < ALIGN_SNAP) nextX = other.x;
  }
  return {
    x: Math.min(0.92, Math.max(0.08, nextX)),
    y: Math.min(0.88, Math.max(0.08, nextY)),
  };
}

export const LOGO_SCALE_MIN = 0.5;
export const LOGO_SCALE_MAX = 2.5;
export const LOGO_SCALE_STEP = 0.25;

export type HookLogo = { path: string; filename: string; x?: number; y?: number; scale?: number };
export type LogoMark = { kind: "mark"; id: string; text: string; x?: number; y?: number; scale?: number };
export type LogoItem = (HookLogo & { kind?: "file" }) | LogoMark;
export type LogoBox =
  | { kind: "logo"; index: number; x: number; y: number; w: number; h: number }
  | { kind: "mark"; text: string; x: number; y: number; size: number };

function fileName(pathValue: string): string {
  const parts = pathValue.split("/");
  return parts[parts.length - 1] || pathValue;
}

function placed(item: { x?: unknown; y?: unknown }): { x: number; y: number } | Record<string, never> {
  const x = Number(item.x);
  const y = Number(item.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return {};
  return { x: Math.min(0.92, Math.max(0.08, x)), y: Math.min(0.88, Math.max(0.08, y)) };
}

export function clampLogoScale(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  const stepped = Math.round(n / LOGO_SCALE_STEP) * LOGO_SCALE_STEP;
  return Math.min(LOGO_SCALE_MAX, Math.max(LOGO_SCALE_MIN, stepped));
}

export function itemScale(item: LogoItem): number {
  return item.scale == null ? 1 : clampLogoScale(item.scale);
}

function scaled(item: { scale?: unknown }): { scale?: number } {
  if (item.scale == null) return {};
  const scale = clampLogoScale(item.scale);
  return scale === 1 ? {} : { scale };
}

export function parseLogoItems(raw: string | null | undefined): LogoItem[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .flatMap((item, index) => {
        if (!item || typeof item !== "object") return [];
        const row = item as LogoItem & { kind?: string; text?: string; id?: string };
        if (row.kind === "mark") {
          const text = String(row.text || "").trim().slice(0, 48);
          if (!text) return [];
          return [{ kind: "mark" as const, id: String(row.id || `mark-${index}`), text, ...placed(row), ...scaled(row) }];
        }
        const pathValue = String((row as HookLogo).path || "").replace(/\\/g, "/");
        const filename = String((row as HookLogo).filename || "").trim();
        if (!pathValue || pathValue.includes("..") || pathValue.startsWith("/")) return [];
        return [{ path: pathValue, filename: filename || fileName(pathValue), ...placed(row), ...scaled(row) }];
      })
      .slice(0, MAX_LOGO_ITEMS);
  } catch {
    return [];
  }
}

export function parseLogos(raw: string | null | undefined): HookLogo[] {
  return parseLogoItems(raw)
    .flatMap((item) => (isLogoFile(item) ? [item] : []))
    .slice(0, MAX_HOOK_LOGOS);
}

export function stringifyLogos(items: LogoItem[]): string {
  return JSON.stringify(items.slice(0, MAX_LOGO_ITEMS));
}

export function isLogoFile(item: LogoItem): item is HookLogo {
  return !("kind" in item && item.kind === "mark") && Boolean((item as HookLogo).path);
}

function centerY(size: number): number {
  return Math.round((CANVAS_H - size) / 2);
}

function rowTop(size: number): number {
  return Math.round(CANVAS_H * LOGO_ROW_Y - size / 2);
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

/** Mixed row: files, +, =, emoji, short text. Uses x/y when the item was dragged. */
export function boxesFromItems(items: LogoItem[]): LogoBox[] {
  if (!items.length) return [];
  const fileBase = items.filter(isLogoFile).length <= 1 ? 280 : 200;
  const widths = items.map((item) => {
    const scale = itemScale(item);
    return isLogoFile(item) ? Math.round(fileBase * scale) : Math.min(400, Math.round(28 * Math.max(1, item.text.length) * scale));
  });
  const gap = 16;
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, items.length - 1);
  let x = Math.round((CANVAS_W - total) / 2);
  let fileIndex = 0;
  return items.map((item, index) => {
    const width = widths[index];
    const scale = itemScale(item);
    if (isLogoFile(item)) {
      const fileSize = Math.round(fileBase * scale);
      const box: LogoBox = { kind: "logo", index: fileIndex, x, y: rowTop(fileSize), w: fileSize, h: fileSize };
      if (item.x != null && item.y != null) {
        box.x = Math.round(item.x * CANVAS_W - fileSize / 2);
        box.y = Math.round(item.y * CANVAS_H - fileSize / 2);
      }
      fileIndex += 1;
      x += width + gap;
      return box;
    }
    const size = Math.round((item.text.length <= 2 ? 88 : 48) * scale);
    const box: LogoBox = {
      kind: "mark",
      text: item.text,
      x: item.x != null ? Math.round(item.x * CANVAS_W - width / 2) : x,
      y: item.y != null ? Math.round(item.y * CANVAS_H - size / 2) : rowTop(fileBase) + Math.round((fileBase - size) / 2),
      size,
    };
    x += width + gap;
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
