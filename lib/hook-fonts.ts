import type { DrawnStyle } from "@/lib/text-style";

export const LOOK_FONT_CLASS: Record<DrawnStyle, string> = {
  tiktok: "font-tiktok",
  instagram: "font-ig",
  plain: "font-sans",
};

/**
 * Em pixels the file draws on a 1080 frame. libass sizes a font so usWinAscent + usWinDescent equals
 * the ASS Fontsize (LOOK_METRICS), so the em is smaller: 82 → 60.3px for TikTok Sans, 104 → 73.0px for
 * Inter Tight. `lookEm` in lib/ass-plate.ts reads the same numbers from the font files; a test ties them.
 * Plain uses Arial Bold on a Mac (2288/2048) and is approximate.
 */
export const LOOK_EM_PX: Record<DrawnStyle, number> = {
  tiktok: 60.29,
  instagram: 73.02,
  plain: 75.2,
};

/**
 * Words and the tile type at the burn em as a share of the stage width (1080 frame).
 * Lines stack at 1.1 of the em in both places (LINE_STEP). Literal classes so Tailwind can see them.
 */
export const LOOK_TYPE_CLASS: Record<DrawnStyle, string> = {
  tiktok: `${LOOK_FONT_CLASS.tiktok} text-[5.583cqw] font-bold leading-[1.1]`,
  instagram: `${LOOK_FONT_CLASS.instagram} text-[6.761cqw] font-bold leading-[1.1]`,
  plain: `${LOOK_FONT_CLASS.plain} text-[6.963cqw] font-bold leading-[1.1]`,
};

/** Preview edge for unboxed words: the burn stroke over the frame width. */
export const LOOK_STROKE_CLASS: Record<DrawnStyle, string> = {
  tiktok: "stroke-tt",
  instagram: "stroke-ig",
  plain: "stroke-tt",
};

/** Room for the stroke and the bold overshoot; a textarea clips anything past its box. */
export const LOOK_STROKE_PAD_CLASS = "px-[0.75cqw]";

/** Headline lines wrap at the safe-zone width (`HOOK_LINE_W`, 80% of the stage), padding outside, like the burn. */
export const HOOK_LINE_CLASS = "box-content max-w-[80cqw]";

export function lookFontName(style: DrawnStyle): string {
  if (style === "tiktok") return "TikTok Sans";
  if (style === "instagram") return "Inter Tight";
  return "Arial";
}
