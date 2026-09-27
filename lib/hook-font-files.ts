import { existsSync } from "fs";
import path from "path";
import type { DrawnStyle } from "@/lib/text-style";
import { lookFontName } from "@/lib/hook-fonts";

const TT_FILE = "TikTokSans-Bold.ttf";
const IG_FILE = "InterTight-SemiBold.ttf";

export function bundledFontsDir(): string {
  return path.join(process.cwd(), "fonts");
}

function bundledFile(style: DrawnStyle): string | undefined {
  if (style === "tiktok") return path.join(bundledFontsDir(), TT_FILE);
  if (style === "instagram") return path.join(bundledFontsDir(), IG_FILE);
  return undefined;
}

export function hookFontFamily(style: DrawnStyle): string {
  const file = bundledFile(style);
  if (file && existsSync(file)) return lookFontName(style);
  if (process.env.HOOK_FONT_FAMILY) return process.env.HOOK_FONT_FAMILY;
  return process.platform === "darwin" ? "Arial" : "DejaVu Sans";
}

export function hookFontFile(style: DrawnStyle): string {
  const file = bundledFile(style);
  if (file && existsSync(file)) return file;
  if (process.env.HOOK_FONT) return process.env.HOOK_FONT;
  return process.platform === "darwin"
    ? "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    : "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
}

export function hookFontsDir(style: DrawnStyle): string {
  const file = bundledFile(style);
  if (file && existsSync(file)) return bundledFontsDir();
  if (process.env.HOOK_FONT) return path.dirname(process.env.HOOK_FONT);
  return process.platform === "darwin" ? "/System/Library/Fonts/Supplemental" : "/usr/share/fonts/truetype/dejavu";
}
