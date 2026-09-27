import type { DrawnStyle } from "@/lib/text-style";

export const LOOK_FONT_CLASS: Record<DrawnStyle, string> = {
  tiktok: "font-tiktok tracking-tight",
  instagram: "font-ig tracking-tight",
  plain: "font-sans",
};

export function lookFontName(style: DrawnStyle): string {
  if (style === "tiktok") return "TikTok Sans";
  if (style === "instagram") return "Inter Tight";
  return "Arial";
}
