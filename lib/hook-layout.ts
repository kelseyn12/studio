export type HookPos = {
  x: number;
  y: number;
  list?: string[];
  listAt?: number[];
  from?: number;
  to?: number;
  logoEq?: boolean;
};

function clamp01(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/** Same safe-zone tops as lib/ass.ts LOOKS. */
export function hookDefaultPos(style: string): HookPos {
  const top = style === "instagram" ? 0.16 : style === "plain" ? 0.12 : 0.17;
  return { x: 0.5, y: top };
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
  });
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
