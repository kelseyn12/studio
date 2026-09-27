import { measureTextPx } from "@/lib/font-measure";
import { hookFontFile } from "@/lib/hook-font-files";
import type { DrawnStyle } from "@/lib/text-style";

/** TikTok text-tool card on a 1080 frame: small corner, tight pad, like the native plate. */
export const TT_BOX_RADIUS = 14;
const PAD_X = 18;
const PAD_Y = 8;
const LINE_STEP = 1.05;

export function plateSize(style: DrawnStyle, lines: string[], fontSize: number): { width: number; height: number } {
  const file = hookFontFile(style);
  const widest = lines.reduce((max, line) => Math.max(max, measureTextPx(file, line, fontSize)), fontSize);
  const height = Math.round(Math.max(1, lines.length) * fontSize * LINE_STEP) + PAD_Y * 2;
  return { width: widest + PAD_X * 2, height };
}

/**
 * ASS drawing with the top-left at 0,0. libass scales \\p1 units by FontSize, so the style uses size 1.
 * A path that crosses below 0 is pinned at its bottom-right, so the card misses the words.
 */
export function roundedPlatePath(width: number, height: number, radius = TT_BOX_RADIUS): string {
  const w = Math.round(width);
  const h = Math.round(height);
  const r = Math.min(radius, Math.floor(w / 2) - 1, Math.floor(h / 2) - 1);
  const k = 0.5522847498;
  const c = Math.round(r * k);
  return [
    `m ${r} 0`,
    `l ${w - r} 0`,
    `b ${w - r + c} 0 ${w} ${r - c} ${w} ${r}`,
    `l ${w} ${h - r}`,
    `b ${w} ${h - r + c} ${w - r + c} ${h} ${w - r} ${h}`,
    `l ${r} ${h}`,
    `b ${r - c} ${h} 0 ${h - r + c} 0 ${h - r}`,
    `l 0 ${r}`,
    `b 0 ${r - c} ${r - c} 0 ${r} 0`,
  ].join(" ");
}

export function lineStep(fontSize: number): number {
  return Math.round(fontSize * LINE_STEP);
}
