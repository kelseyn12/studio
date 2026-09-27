export type HookPos = { x: number; y: number };

/** Same safe-zone tops as lib/ass.ts LOOKS. */
export function hookDefaultPos(style: string): HookPos {
  const top = style === "instagram" ? 0.16 : style === "plain" ? 0.12 : 0.17;
  return { x: 0.5, y: top };
}

export function parseHookLayout(raw: string | null | undefined): HookPos | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown };
    const x = Number(parsed.x);
    const y = Number(parsed.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x: Math.min(0.92, Math.max(0.08, x)), y: Math.min(0.88, Math.max(0.08, y)) };
  } catch {
    return null;
  }
}

export function stringifyHookLayout(pos: HookPos): string {
  return JSON.stringify({ x: pos.x, y: pos.y });
}

export type CutUndo = { path: string; thumbPath: string; size: number };

export function parseCutUndo(raw: string | null | undefined): CutUndo | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as CutUndo;
    if (!parsed.path || parsed.path.includes("..")) return null;
    return { path: parsed.path, thumbPath: parsed.thumbPath || "", size: Number(parsed.size) || 0 };
  } catch {
    return null;
  }
}
