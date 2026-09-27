export const MIN_CLIP_SECONDS = 0.5;

export type TimeRange = { start: number; end: number };

export const SPEED_CHOICES = [1, 1.25, 1.5, 2] as const;

export function parseSpeed(value: unknown): number {
  const speed = Number(value ?? 1);
  return SPEED_CHOICES.find((choice) => Math.abs(choice - speed) < 0.01) ?? 1;
}

/** Halve PTS for 2×. Do not add fps or -r after this — they write 30fps timestamps and undo the speed. */
export function speedVideoFilter(speed: number): string {
  return `setpts=(PTS-STARTPTS)/${speed}`;
}

/** atempo max is 2; every SPEED_CHOICES value fits in one filter. */
export function speedAudioFilter(speed: number): string {
  return `atempo=${speed}`;
}

export function parseDrops(value: unknown): TimeRange[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const start = Number((item as TimeRange).start);
    const end = Number((item as TimeRange).end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end - start < 0.15) return [];
    return [{ start, end }];
  });
}

function clampRange(range: TimeRange, window: TimeRange): TimeRange | null {
  const start = Math.max(window.start, range.start);
  const end = Math.min(window.end, range.end);
  if (end - start < 0.15) return null;
  return { start, end };
}

export function mergeRanges(ranges: TimeRange[]): TimeRange[] {
  const sorted = ranges
    .filter((range) => range.end > range.start)
    .sort((left, right) => left.start - right.start);
  const merged: TimeRange[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (!last || range.start > last.end) merged.push({ ...range });
    else last.end = Math.max(last.end, range.end);
  }
  return merged;
}

/** What is left after dropping draggy parts from a keep window. */
export function keepRanges(keep: TimeRange, drops: TimeRange[]): TimeRange[] {
  if (!Number.isFinite(keep.start) || !Number.isFinite(keep.end) || keep.end - keep.start < MIN_CLIP_SECONDS) {
    return [];
  }
  const window = { start: Math.max(0, keep.start), end: keep.end };
  const cleaned = mergeRanges(drops.map((drop) => clampRange(drop, window)).filter((drop): drop is TimeRange => Boolean(drop)));
  const kept: TimeRange[] = [];
  let cursor = window.start;
  for (const drop of cleaned) {
    if (drop.start - cursor >= 0.15) kept.push({ start: cursor, end: drop.start });
    cursor = Math.max(cursor, drop.end);
  }
  if (window.end - cursor >= 0.15) kept.push({ start: cursor, end: window.end });
  return kept;
}

export function keptSeconds(ranges: TimeRange[]): number {
  return ranges.reduce((sum, range) => sum + (range.end - range.start), 0);
}

export function isPlayableCut(ranges: TimeRange[]): boolean {
  return ranges.length > 0 && keptSeconds(ranges) >= MIN_CLIP_SECONDS;
}

/** Stay inside a kept range. Otherwise jump to the next keep, or stop at the end. */
export function keepPlayback(time: number, ranges: TimeRange[]): { seek: number } | "stay" | "end" {
  if (!ranges.length || !Number.isFinite(time)) return "stay";
  const inside = ranges.some((range) => time >= range.start - 0.03 && time < range.end - 0.04);
  if (inside) return "stay";
  const next = ranges.find((range) => range.end - 0.04 > time);
  if (!next) return "end";
  if (Math.abs(time - next.start) <= 0.03) return "stay";
  return { seek: next.start };
}
