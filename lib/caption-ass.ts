import { mkdir, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { assClock, assColor, escapeAssText, escapeFilterPath } from "@/lib/ass";
import type { CaptionPhrase } from "@/lib/captions-math";
import { hookFontFamily, hookFontsDir } from "@/lib/hook-font-files";
import { FRAME_H, FRAME_W } from "@/lib/list-layout";
import type { DrawnStyle } from "@/lib/text-style";

/** CapCut auto-captions: white + black outline, lower third. IG is tighter stroke; TT is fatter. */
export const CAPTION_METRICS: Record<DrawnStyle, { fontsize: number; y: number; outline: number }> = {
  tiktok: { fontsize: 64, y: 0.7, outline: 9 },
  instagram: { fontsize: 58, y: 0.72, outline: 7 },
  plain: { fontsize: 62, y: 0.7, outline: 8 },
};

function shifted(phrase: CaptionPhrase, trimStart: number): { start: number; end: number } | null {
  const start = Math.max(0, phrase.start - trimStart);
  const end = Math.max(0, phrase.end - trimStart);
  if (end <= start) return null;
  return { start, end };
}

export function buildCaptionAss(phrases: CaptionPhrase[], trimStart: number, style: DrawnStyle = "plain"): string {
  const look = CAPTION_METRICS[style];
  const font = hookFontFamily(style);
  const px = Math.round(FRAME_W * 0.5);
  const py = Math.round(FRAME_H * look.y);
  const ink = assColor("white");
  const edge = assColor("black");
  const events = phrases.flatMap((phrase) => {
    const window = shifted(phrase, trimStart);
    if (!window || !phrase.text.trim()) return [];
    return [
      `Dialogue: 0,${assClock(window.start)},${assClock(window.end)},Cap,,0,0,0,,{\\an5\\pos(${px},${py})}{\\c${ink}}${escapeAssText(phrase.text.trim())}`,
    ];
  });
  return [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${FRAME_W}`,
    `PlayResY: ${FRAME_H}`,
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Cap,${font},${look.fontsize},${ink},${ink},${edge},&H00000000&,-1,0,0,0,100,100,0,0,1,${look.outline},0,5,60,60,0,1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...events,
    "",
  ].join("\n");
}

export async function writeCaptionAss(
  phrases: CaptionPhrase[],
  trimStart: number,
  style: DrawnStyle = "plain",
): Promise<string> {
  const dir = path.join(os.tmpdir(), "studio-ass");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${randomUUID()}.ass`);
  await writeFile(file, buildCaptionAss(phrases, trimStart, style), "utf8");
  return `ass=filename=${escapeFilterPath(file)}:fontsdir=${escapeFilterPath(hookFontsDir(style))}`;
}
