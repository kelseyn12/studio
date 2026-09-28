import { emPerAssUnit } from "@/lib/font-measure";
import { hookFontFile } from "@/lib/hook-font-files";
import type { DrawnStyle } from "@/lib/text-style";

/** TikTok text-tool card on a 1080 frame: small corner, tight pad, like the native plate. */
export const TT_BOX_RADIUS = 14;
const PAD_X = 18;
const PAD_Y = 8;
/** Line pitch as a share of the em. Words previews with `leading-[1.1]`; headline lines burn on this pitch too. */
export const LINE_STEP = 1.1;

/** Em pixels of this look's ASS Fontsize with its bundled font (a custom font name is taken as-is). */
export function lookEm(style: DrawnStyle, fontSize: number, customFont?: string): number {
  return customFont ? fontSize : fontSize * emPerAssUnit(hookFontFile(style));
}

/** Card around the lines; `widths` are the burn widths of each line (emoji advances included). */
export function plateSize(widths: number[], em: number): { width: number; height: number } {
  const widest = widths.reduce((max, width) => Math.max(max, width), Math.round(em));
  const height = Math.max(1, widths.length) * lineStep(em) + PAD_Y * 2;
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

export function lineStep(em: number): number {
  return Math.round(em * LINE_STEP);
}
