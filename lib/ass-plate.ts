import { measureTextPx } from "@/lib/font-measure";
import { hookFontFile } from "@/lib/hook-font-files";
import type { DrawnStyle } from "@/lib/text-style";

/** TikTok text-tool card on a 1080 frame: modest corner, not a pill. */
export const TT_BOX_RADIUS = 28;
const PAD_X = 26;
const PAD_Y = 18;
const LINE_STEP = 1.15;

export function plateSize(style: DrawnStyle, lines: string[], fontSize: number): { width: number; height: number } {
  const file = hookFontFile(style);
  const widest = lines.reduce((max, line) => Math.max(max, measureTextPx(file, line, fontSize)), fontSize);
  const height = Math.round(Math.max(1, lines.length) * fontSize * LINE_STEP) + PAD_Y * 2;
  return { width: widest + PAD_X * 2, height };
}

/** ASS drawing, centered on 0,0. libass scales \\p1 units by FontSize, so the style uses size 1. */
export function roundedPlatePath(width: number, height: number, radius = TT_BOX_RADIUS): string {
  const w = Math.round(width);
  const h = Math.round(height);
  const r = Math.min(radius, Math.floor(w / 2) - 1, Math.floor(h / 2) - 1);
  const k = 0.5522847498;
  const c = Math.round(r * k);
  const x0 = -Math.round(w / 2);
  const y0 = -Math.round(h / 2);
  const x1 = x0 + w;
  const y1 = y0 + h;
  return [
    `m ${x0 + r} ${y0}`,
    `l ${x1 - r} ${y0}`,
    `b ${x1 - r + c} ${y0} ${x1} ${y0 + r - c} ${x1} ${y0 + r}`,
    `l ${x1} ${y1 - r}`,
    `b ${x1} ${y1 - r + c} ${x1 - r + c} ${y1} ${x1 - r} ${y1}`,
    `l ${x0 + r} ${y1}`,
    `b ${x0 + r - c} ${y1} ${x0} ${y1 - r + c} ${x0} ${y1 - r}`,
    `l ${x0} ${y0 + r}`,
    `b ${x0} ${y0 + r - c} ${x0 + r - c} ${y0} ${x0 + r} ${y0}`,
  ].join(" ");
}

export function lineStep(fontSize: number): number {
  return Math.round(fontSize * LINE_STEP);
}
