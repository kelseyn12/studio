import { mkdir, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { assClock, assColor, escapeAssText, escapeFilterPath } from "@/lib/ass";
import type { CaptionPhrase, CaptionWord } from "@/lib/captions-math";
import { captionCase } from "@/lib/captions-math";
import { hookFontFamily, hookFontsDir } from "@/lib/hook-font-files";
import { FRAME_H, FRAME_W } from "@/lib/list-layout";
import type { DrawnStyle } from "@/lib/text-style";

/** CapCut-style auto captions: lower third, not Classic Words. */
export const CAPTION_METRICS: Record<DrawnStyle, { fontsize: number; y: number; outline: number; shadow: number; boxed: boolean }> = {
  tiktok: { fontsize: 54, y: 0.7, outline: 5, shadow: 2, boxed: false },
  instagram: { fontsize: 48, y: 0.72, outline: 12, shadow: 0, boxed: true },
  plain: { fontsize: 54, y: 0.7, outline: 5, shadow: 1, boxed: false },
};

function shifted(phrase: CaptionPhrase, trimStart: number): { start: number; end: number } | null {
  const start = Math.max(0, phrase.start - trimStart);
  const end = Math.max(0, phrase.end - trimStart);
  if (end <= start) return null;
  return { start, end };
}

function inkWords(words: CaptionWord[], active: number): string {
  return words
    .map((item, index) => {
      const text = escapeAssText(index === 0 ? captionCase(item.word) : item.word.trim());
      const color = index === active ? "yellow" : "white";
      return `{\\c${assColor(color)}}${text}`;
    })
    .join(" ");
}

function eventsFor(phrase: CaptionPhrase, trimStart: number, karaoke: boolean, y: number): string[] {
  const window = shifted(phrase, trimStart);
  if (!window) return [];
  const px = Math.round(FRAME_W * 0.5);
  const words = phrase.words?.filter((item) => item.word.trim()) ?? [];
  const tag = (start: number, end: number, body: string) =>
    `Dialogue: 0,${assClock(start)},${assClock(end)},Cap,,0,0,0,,{\\an5\\pos(${px},${y})}${body}`;

  if (karaoke && words.length > 1) {
    return words.map((word, index) => {
      const start = Math.max(window.start, word.start - trimStart);
      const end = Math.max(start + 0.05, (words[index + 1]?.start ?? phrase.end) - trimStart);
      return tag(start, Math.min(window.end, end), inkWords(words, index));
    });
  }
  const text = escapeAssText(captionCase(phrase.text));
  return [tag(window.start, window.end, `{\\c${assColor("white")}}${text}`)];
}

export function buildCaptionAss(phrases: CaptionPhrase[], trimStart: number, style: DrawnStyle = "plain"): string {
  const look = CAPTION_METRICS[style];
  const font = hookFontFamily(style);
  const y = Math.round(FRAME_H * look.y);
  const events = phrases.flatMap((phrase) => eventsFor(phrase, trimStart, style === "tiktok", y));
  const border = look.boxed ? 3 : 1;
  const ink = assColor("white");
  const edge = assColor("black");
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
    `Style: Cap,${font},${look.fontsize},${ink},${ink},${edge},&H00000000&,-1,0,0,0,100,100,0,0,${border},${look.outline},${look.shadow},5,60,60,0,1`,
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
