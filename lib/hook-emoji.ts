import path from "path";
import { emPerAssUnit, measureTextPx } from "@/lib/font-measure";
import { bundledFontsDir, hookFontFile } from "@/lib/hook-font-files";
import { HOOK_LINE_MAX_PX } from "@/lib/list-layout";
import { HOOK_MAX_CHARS, type DrawnStyle } from "@/lib/text-style";

/**
 * Emoji inside a headline. TikTok Sans and Inter Tight have no emoji glyphs, so libass
 * draws a hollow box. We hand emoji runs to the bundled Noto Emoji outline font for their
 * advance (drawn fully transparent), then overlay the Noto Color Emoji PNG on that spot.
 * Without art (offline) the outline glyph stays visible so the word still reads.
 */
export const EMOJI_FONT_NAME = "Noto Emoji";
export const EMOJI_FONT_FILE = path.join(bundledFontsDir(), "NotoEmoji.ttf");
/** Colour art is drawn a touch inside the advance box so it sits like the outline glyph would. */
const ART_PER_ADVANCE = 0.92;

export type TextRun = { text: string; emoji: boolean };
export type EmojiSpot = { text: string; x: number; y: number; size: number };

const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export function isEmojiGrapheme(grapheme: string): boolean {
  return /\p{Extended_Pictographic}/u.test(grapheme) || /^\p{Regional_Indicator}{2}$/u.test(grapheme);
}

export function hasEmoji(text: string): boolean {
  return splitEmojiRuns(text).some((run) => run.emoji);
}

/** Text runs with each emoji grapheme on its own; plain letters between them stay merged. */
export function splitEmojiRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  for (const { segment } of graphemes.segment(text)) {
    const emoji = isEmojiGrapheme(segment);
    const last = runs[runs.length - 1];
    if (last && !emoji && !last.emoji) last.text += segment;
    else runs.push({ text: segment, emoji });
  }
  return runs;
}

/** Em pixels libass gives Noto Emoji for this ASS Fontsize (its own win metrics, not the look font's). */
export function emojiEm(fontSize: number): number {
  return fontSize * emPerAssUnit(EMOJI_FONT_FILE);
}

/** Advance of one emoji grapheme. A ZWJ sequence shapes to one glyph, so only the first code point counts. */
export function emojiAdvance(grapheme: string, fontSize: number): number {
  const first = String.fromCodePoint(grapheme.codePointAt(0) ?? 0x2b50);
  return measureTextPx(EMOJI_FONT_FILE, first, emojiEm(fontSize));
}

export function runWidth(run: TextRun, style: DrawnStyle, em: number, fontSize: number): number {
  return run.emoji ? emojiAdvance(run.text, fontSize) : measureTextPx(hookFontFile(style), run.text, em);
}

/** Line width the way libass will lay it out, emoji advances included. */
export function lineWidthPx(line: string, style: DrawnStyle, em: number, fontSize: number): number {
  return splitEmojiRuns(line).reduce((sum, run) => sum + runWidth(run, style, em, fontSize), 0);
}

/**
 * Word-wraps a headline on measured width, the way the browser wraps Words at the same max width
 * with the same font. A single word wider than the line stays on its own line.
 */
export function wrapHookToWidth(text: string, style: DrawnStyle, em: number, fontSize: number, maxPx = HOOK_LINE_MAX_PX): string[] {
  const words = text.trim().slice(0, HOOK_MAX_CHARS).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && lineWidthPx(candidate, style, em, fontSize) > maxPx) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Centre and size of every emoji on a line whose centre is at (cx, cy). */
export function lineEmojiSpots(line: string, style: DrawnStyle, em: number, fontSize: number, cx: number, cy: number): EmojiSpot[] {
  const runs = splitEmojiRuns(line);
  const widths = runs.map((run) => runWidth(run, style, em, fontSize));
  const total = widths.reduce((sum, width) => sum + width, 0);
  let cursor = cx - total / 2;
  const spots: EmojiSpot[] = [];
  runs.forEach((run, index) => {
    if (run.emoji) {
      spots.push({ text: run.text, x: cursor + widths[index] / 2, y: cy, size: Math.round(widths[index] * ART_PER_ADVANCE) });
    }
    cursor += widths[index];
  });
  return spots;
}
