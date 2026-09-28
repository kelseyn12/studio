import type { DrawnStyle } from "@/lib/text-style";

export const LOOK_FONT_CLASS: Record<DrawnStyle, string> = {
  tiktok: "font-tiktok",
  instagram: "font-ig tracking-tight",
  plain: "font-sans",
};

/**
 * Words and the tile type at the burn size: LOOK_METRICS fontsize over the 1080 frame, as a share of the stage width.
 * Line pitch in the file is about 1.1 of the size. Literal classes so Tailwind can see them.
 */
export const LOOK_TYPE_CLASS: Record<DrawnStyle, string> = {
  tiktok: `${LOOK_FONT_CLASS.tiktok} text-[7.593cqw] font-bold leading-[1.1]`,
  instagram: `${LOOK_FONT_CLASS.instagram} text-[9.630cqw] font-bold leading-[1.1]`,
  plain: `${LOOK_FONT_CLASS.plain} text-[7.778cqw] font-bold leading-[1.1]`,
};

/** Preview edge for unboxed words: the burn stroke over the frame width. */
export const LOOK_STROKE_CLASS: Record<DrawnStyle, string> = {
  tiktok: "stroke-tt",
  instagram: "stroke-ig",
  plain: "stroke-tt",
};

export function lookFontName(style: DrawnStyle): string {
  if (style === "tiktok") return "TikTok Sans";
  if (style === "instagram") return "Inter Tight";
  return "Arial";
}
