import { LOOK_METRICS } from "@/lib/list-layout";
import type { DrawnStyle } from "@/lib/text-style";

export type BoxChoice = boolean | "white";
export type LookBox = BoxChoice | "off";
export type LookBoxes = { tiktok?: LookBox; instagram?: LookBox };
export type LookPoint = { x: number; y: number };
export type LookPlaces = { tiktok?: LookPoint; instagram?: LookPoint };

export type HookPos = {
  x: number;
  y: number;
  list?: string[];
  listAt?: number[];
  from?: number;
  to?: number;
  logoEq?: boolean;
  /** Shared box from before looks could differ. Ignored once `boxes` is set. */
  box?: BoxChoice;
  boxes?: LookBoxes;
  /** Per-look text spot. Shared `x`/`y` apply to both until you drag one look. */
  places?: LookPlaces;
};

function clamp01(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/** Same safe-zone tops as native TT / IG metrics. */
export function hookDefaultPos(style: string): HookPos {
  const look = (style in LOOK_METRICS ? style : "tiktok") as DrawnStyle;
  return { x: 0.5, y: LOOK_METRICS[look].top };
}

export function parseListLines(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((line) => String(line || "").trim()).filter(Boolean).slice(0, 10);
}

export function parseListAt(raw: unknown): number[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const times = raw.map((value) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : NaN;
  });
  if (!times.some((n) => Number.isFinite(n))) return undefined;
  return times;
}

export function parseHookLayout(raw: string | null | undefined): HookPos | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<HookPos>;
    const x = Number(parsed.x);
    const y = Number(parsed.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    const from = Number(parsed.from);
    const to = Number(parsed.to);
    return {
      x: clamp01(x, 0.08, 0.92),
      y: clamp01(y, 0.08, 0.88),
      list: parseListLines(parsed.list),
      listAt: parseListAt(parsed.listAt),
      ...(Number.isFinite(from) && from >= 0 ? { from } : {}),
      ...(Number.isFinite(to) && to > 0 ? { to } : {}),
      ...(parsed.logoEq ? { logoEq: true } : {}),
      ...(parsed.box === "white" ? { box: "white" as const } : parsed.box ? { box: true } : {}),
      ...parseBoxes(parsed.boxes),
      ...parsePlaces(parsed.places),
    };
  } catch {
    return null;
  }
}

export function stringifyHookLayout(pos: HookPos): string {
  return JSON.stringify({
    x: pos.x,
    y: pos.y,
    ...(pos.list?.length ? { list: pos.list } : {}),
    ...(pos.listAt?.some((time) => Number.isFinite(time)) ? { listAt: pos.listAt } : {}),
    ...(pos.from != null ? { from: pos.from } : {}),
    ...(pos.to != null ? { to: pos.to } : {}),
    ...(pos.logoEq ? { logoEq: true } : {}),
    ...(pos.boxes ? { boxes: pos.boxes } : pos.box === "white" ? { box: "white" as const } : pos.box ? { box: true } : {}),
    ...(pos.places ? { places: pos.places } : {}),
  });
}

function parsePoint(value: unknown): LookPoint | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as { x?: unknown; y?: unknown };
  const x = Number(row.x);
  const y = Number(row.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  return { x: clamp01(x, 0.08, 0.92), y: clamp01(y, 0.08, 0.88) };
}

function parsePlaces(raw: unknown): { places: LookPlaces } | Record<string, never> {
  if (!raw || typeof raw !== "object") return {};
  const row = raw as { tiktok?: unknown; instagram?: unknown };
  const tiktok = parsePoint(row.tiktok);
  const instagram = parsePoint(row.instagram);
  if (!tiktok && !instagram) return {};
  return { places: { ...(tiktok ? { tiktok } : {}), ...(instagram ? { instagram } : {}) } };
}

/** Where this look's headline sits. A shared point applies until you drag one look. */
export function posFor(pos: Pick<HookPos, "x" | "y" | "places"> | null | undefined, style: string): LookPoint {
  const look = style === "instagram" ? "instagram" : "tiktok";
  const specific = pos?.places?.[look];
  if (specific) return specific;
  const top = LOOK_METRICS[look].top;
  return {
    x: clamp01(pos?.x ?? 0.5, 0.08, 0.92),
    y: clamp01(pos?.y ?? top, 0.08, 0.88),
  };
}

/** Move the look you are previewing. The other look keeps the spot it already had. */
export function setLookPos(pos: HookPos, style: string, x: number, y: number): HookPos {
  const look = style === "instagram" ? "instagram" : "tiktok";
  const other = look === "tiktok" ? "instagram" : "tiktok";
  return {
    ...pos,
    places: {
      [look]: { x: clamp01(x, 0.08, 0.92), y: clamp01(y, 0.08, 0.88) },
      [other]: pos.places?.[other] ?? { x: pos.x, y: pos.y },
    },
  };
}

function parseOneBox(value: unknown): LookBox | undefined {
  if (value === "off" || value === "white") return value;
  if (value === true) return true;
  return undefined;
}

function parseBoxes(raw: unknown): { boxes: LookBoxes } | Record<string, never> {
  if (!raw || typeof raw !== "object") return {};
  const row = raw as { tiktok?: unknown; instagram?: unknown };
  const tiktok = parseOneBox(row.tiktok);
  const instagram = parseOneBox(row.instagram);
  if (!tiktok && !instagram) return {};
  return { boxes: { ...(tiktok ? { tiktok } : {}), ...(instagram ? { instagram } : {}) } };
}

/** TikTok can wear a plate. Instagram stays the font, with no plate. */
export function boxFor(pos: Pick<HookPos, "box" | "boxes"> | null | undefined, style: string): BoxChoice | undefined {
  if (style === "instagram") return undefined;
  const specific = pos?.boxes?.tiktok;
  if (specific === "off") return undefined;
  if (specific) return specific;
  if (pos?.boxes) return undefined;
  return pos?.box;
}

/** Cycle the box on the look you are previewing. The other look stays as it is. */
export function setLookBox(pos: HookPos, style: string, next: BoxChoice | undefined): HookPos {
  const look = style === "instagram" ? "instagram" : "tiktok";
  const other = look === "tiktok" ? "instagram" : "tiktok";
  return {
    ...pos,
    box: undefined,
    boxes: {
      [look]: next ?? "off",
      [other]: boxFor(pos, other) ?? "off",
    },
  };
}

export function nextBox(box?: boolean | "white"): boolean | "white" | undefined {
  if (!box) return true;
  if (box === true) return "white";
  return undefined;
}

export function boxLabel(box?: BoxChoice, style?: string): string {
  const who = style === "instagram" ? "IG " : style === "tiktok" ? "TT " : "";
  if (box === "white") return `${who}white box`;
  if (box) return `${who}black box`;
  return `${who}box off`;
}

export type CutUndo = { path: string; thumbPath: string; size: number; basePath: string };

function safeRel(value: unknown): string {
  if (typeof value !== "string" || !value || value.includes("..")) return "";
  return value;
}

export function parseCutUndo(raw: string | null | undefined): CutUndo | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CutUndo>;
    const path = safeRel(parsed.path);
    if (!path) return null;
    const basePath = safeRel(parsed.basePath) || path;
    return { path, thumbPath: safeRel(parsed.thumbPath), size: Number(parsed.size) || 0, basePath };
  } catch {
    return null;
  }
}

/** 1× source — the recorded file, not a previous sped cut. */
export function cutPreviewPath(path: string, cutUndo?: string): string {
  return parseCutUndo(cutUndo)?.basePath || path;
}
