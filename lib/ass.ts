import { mkdir, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { hookFontFamily, hookFontsDir } from "@/lib/hook-font-files";
import { wrapHook, type DrawnStyle } from "@/lib/text-style";
import { lineStep, lookEm, plateSize, roundedPlatePath } from "@/lib/ass-plate";
import { clampListCount, FRAME_H, FRAME_W, listStack, LOOK_METRICS, lookPaint, type ListStack } from "@/lib/list-layout";
import { LIST_MAX } from "@/lib/variations";

export { FRAME_H, FRAME_W };

/**
 * Hook text as an ASS subtitle track rendered by libass. One line can mix colors
 * (the Sasha "*WORST* birthday months" highlight), each look has its own border/box,
 * and a numbered list can sit under the headline. Works on ffmpeg 5 (Fly) and 9 (Mac).
 */
export const DEFAULT_ACCENT = "#5CFF5C";

export type Segment = { text: string; accent: boolean };

/** `*WORST* birthday months` → [{WORST, accent}, { birthday months}]. Stars are the only markup. */
export function parseHighlight(line: string): Segment[] {
  const segments: Segment[] = [];
  const pattern = /\*([^*]+)\*/g;
  let last = 0;
  for (const match of line.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) segments.push({ text: line.slice(last, start), accent: false });
    segments.push({ text: match[1], accent: true });
    last = start + match[0].length;
  }
  if (last < line.length) segments.push({ text: line.slice(last), accent: false });
  return segments.filter((segment) => segment.text.length > 0);
}

export function stripHighlight(line: string): string {
  return line.replace(/\*([^*]+)\*/g, "$1");
}

const NAMED: Record<string, string> = {
  white: "FFFFFF",
  black: "000000",
  yellow: "FFFF00",
  red: "FF0000",
  green: "00FF00",
  blue: "0000FF",
};

/** CSS-ish color → ASS &HBBGGRR& (libass byte order). */
export function assColor(color: string): string {
  const hex = (NAMED[color.toLowerCase()] ?? color.replace("#", "")).padStart(6, "0").slice(-6).toUpperCase();
  return `&H${hex.slice(4, 6)}${hex.slice(2, 4)}${hex.slice(0, 2)}&`;
}

export function escapeAssText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\{/g, "(").replace(/\}/g, ")").replace(/\n/g, " ");
}

export function fontFamily(style: DrawnStyle = "plain"): string {
  return hookFontFamily(style);
}

export function fontsDir(style: DrawnStyle = "plain"): string {
  return hookFontsDir(style);
}

function headline(segments: Segment[][], base: string, accent: string): string {
  return segments
    .map((line) =>
      line
        .map((segment) => `{\\c${assColor(segment.accent ? accent : base)}}${escapeAssText(segment.text)}`)
        .join(""),
    )
    .join("\\N");
}

/** ASS clock: H:MM:SS.CC */
export function assClock(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const rest = clamped - hours * 3600 - minutes * 60;
  const whole = Math.floor(rest);
  const hundredths = Math.min(99, Math.round((rest - whole) * 100));
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(whole).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}

export function buildHookAss(input: {
  text: string;
  style: DrawnStyle;
  baseColor?: string;
  accentColor?: string;
  listCount?: number;
  listItems?: string[];
  listAt?: number[];
  font?: string;
  x?: number;
  y?: number;
  from?: number;
  to?: number;
  box?: boolean | "white";
  listStack?: ListStack;
}): string {
  const look = LOOK_METRICS[input.style];
  const drawnCard = Boolean(input.box) && input.style === "tiktok";
  const paint = drawnCard ? { borderStyle: 1 as const, outline: 0, shadow: 0 } : lookPaint(input.style, input.box);
  const listPaint = drawnCard ? lookPaint(input.style) : paint;
  const font = input.font ?? hookFontFamily(input.style);
  const base = input.baseColor || "white";
  const accent = input.accentColor || DEFAULT_ACCENT;
  const lines = wrapHookKeepingStars(input.text);
  const placed = Number.isFinite(input.x) && Number.isFinite(input.y);
  const px = Math.round(FRAME_W * Math.min(0.92, Math.max(0.08, input.x ?? 0.5)));
  const py = Math.round(FRAME_H * Math.min(0.88, Math.max(0.08, input.y ?? look.top)));
  const marginV = placed ? 0 : Math.round(FRAME_H * look.top);
  const startAt = assClock(input.from ?? 0);
  const endAt = assClock(input.to && input.to > (input.from ?? 0) ? input.to : 9 * 3600 + 59 * 60 + 59);
  const events: string[] = [];
  if (input.text.trim()) {
    if (input.box && input.style !== "tiktok") {
      const lineH = Math.round(look.fontsize * look.lineGap);
      const mid = (lines.length - 1) / 2;
      const boxX = placed ? px : Math.round(FRAME_W * 0.5);
      lines.forEach((line, index) => {
        const y = placed
          ? py + Math.round((index - mid) * lineH)
          : Math.round(marginV + look.fontsize * 0.5 + index * lineH);
        events.push(
          `Dialogue: 0,${startAt},${endAt},Head,,0,0,0,,{\\an5\\pos(${boxX},${y})}${headline([parseHighlight(line)], input.box === "white" ? "black" : "white", accent)}`,
        );
      });
    } else {
      const ink = input.box === "white" ? "black" : input.box ? "white" : base;
      const em = lookEm(input.style, look.fontsize, input.font);
      const step = lineStep(em);
      const blockH = lines.length * step;
      const cx = placed ? px : Math.round(FRAME_W / 2);
      const cy = placed ? py : Math.round(marginV + blockH / 2);
      if (drawnCard) {
        const size = plateSize(input.style, lines.map(stripHighlight), em);
        events.push(
          `Dialogue: 0,${startAt},${endAt},Plate,,0,0,0,,{\\an5\\pos(${cx},${cy})\\p1}${roundedPlatePath(size.width, size.height)}`,
        );
      }
      // One event per line on our own pitch, so the file stacks lines the way Words shows them.
      const mid = (lines.length - 1) / 2;
      lines.forEach((line, index) => {
        const y = cy + Math.round((index - mid) * step);
        events.push(`Dialogue: 0,${startAt},${endAt},Head,,0,0,0,,{\\an5\\pos(${cx},${y})}${headline([parseHighlight(line)], ink, accent)}`);
      });
    }
  }
  const listItems = (input.listItems ?? []).map((line) => line.trim()).filter(Boolean).slice(0, LIST_MAX);
  const listCount = clampListCount(Math.max(listItems.length, input.listCount ?? 0));
  if (listCount > 0) {
    const stack = listStack({
      style: input.style,
      headline: input.text,
      x: input.x,
      y: input.y,
      count: listCount,
      stack: input.listStack,
    });
    for (let index = 0; index < listCount; index += 1) {
      const y = stack.top + index * stack.gap;
      const number = `${index + 1}.`;
      const words = listItems[index] ? `${number} ${escapeAssText(listItems[index])}` : number;
      const wordAt = Number(input.listAt?.[index]);
      if (listItems[index] && Number.isFinite(wordAt)) {
        events.push(`Dialogue: 0,${assClock(0)},${assClock(wordAt)},List,,0,0,0,,{\\pos(${stack.left},${y})}${number}`);
        events.push(`Dialogue: 0,${assClock(wordAt)},${endAt},List,,0,0,0,,{\\pos(${stack.left},${y})}${words}`);
      } else {
        events.push(`Dialogue: 0,${assClock(0)},${endAt},List,,0,0,0,,{\\pos(${stack.left},${y})}${number}`);
      }
    }
  }
  const ink = input.box ? assColor(input.box === "white" ? "black" : "white") : assColor(base);
  const edge = input.box && !drawnCard ? assColor(input.box === "white" ? "white" : "black") : "&H00000000&";
  const plateFill = assColor(input.box === "white" ? "white" : "black");
  const styleRow = (
    name: string,
    size: number,
    border: 1 | 3,
    outline: number,
    shadow: number,
    align: number,
    mv: number,
    primary = ink,
    outlineColor = edge,
  ) =>
    `Style: ${name},${font},${size},${primary},${primary},${outlineColor},&H00000000&,-1,0,0,0,100,100,0,0,${border},${outline},${shadow},${align},60,60,${mv},1`;
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
    ...(drawnCard ? [styleRow("Plate", 1, 1, 0, 0, 5, 0, plateFill)] : []),
    styleRow("Head", look.fontsize, paint.borderStyle, paint.outline, paint.shadow, 8, marginV),
    styleRow(
      "List",
      Math.round(look.fontsize * 0.95),
      listPaint.borderStyle,
      listPaint.outline,
      listPaint.shadow,
      7,
      0,
      drawnCard ? assColor(base) : ink,
      drawnCard ? assColor("black") : edge,
    ),
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...events,
    "",
  ].join("\n");
}

/** Wrap on the plain text, then put the stars back on the same words. */
function wrapHookKeepingStars(text: string): string[] {
  const accented = new Set(parseHighlight(text).filter((s) => s.accent).flatMap((s) => s.text.split(/\s+/)));
  return wrapHook(stripHighlight(text)).map((line) =>
    line
      .split(" ")
      .map((word) => (accented.has(word) ? `*${word}*` : word))
      .join(" "),
  );
}

/** Writes the track to the temp folder and returns an `ass=` filter for it. */
export async function writeHookAss(input: Parameters<typeof buildHookAss>[0]): Promise<string> {
  const dir = path.join(os.tmpdir(), "studio-ass");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${randomUUID()}.ass`);
  await writeFile(file, buildHookAss(input), "utf8");
  return `ass=filename=${escapeFilterPath(file)}:fontsdir=${escapeFilterPath(hookFontsDir(input.style))}`;
}

export function escapeFilterPath(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'").replace(/ /g, "\\ ");
}
