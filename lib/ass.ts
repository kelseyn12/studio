import { mkdir, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { wrapHook, type DrawnStyle } from "@/lib/text-style";
import { LIST_MAX } from "@/lib/variations";

/**
 * Hook text as an ASS subtitle track rendered by libass. One line can mix colors
 * (the Sasha "*WORST* birthday months" highlight), each look has its own border/box,
 * and a numbered list can sit under the headline. Works on ffmpeg 5 (Fly) and 9 (Mac).
 */
export const FRAME_W = 1080;
export const FRAME_H = 1920;
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

type LookSpec = { fontsize: number; borderStyle: 1 | 3; outline: number; shadow: number; top: number; lineGap: number };

/** Same safe-zone numbers as drawtext looks: clear of app headers (top 9–12%). */
const LOOKS: Record<DrawnStyle, LookSpec> = {
  tiktok: { fontsize: 88, borderStyle: 1, outline: 6, shadow: 3, top: 0.17, lineGap: 1.12 },
  instagram: { fontsize: 80, borderStyle: 3, outline: 20, shadow: 0, top: 0.16, lineGap: 1.25 },
  plain: { fontsize: 84, borderStyle: 1, outline: 6, shadow: 0, top: 0.12, lineGap: 1.12 },
};

export function fontFamily(): string {
  return process.env.HOOK_FONT_FAMILY || (process.platform === "darwin" ? "Arial" : "DejaVu Sans");
}

export function fontsDir(): string {
  if (process.env.HOOK_FONT) return path.dirname(process.env.HOOK_FONT);
  return process.platform === "darwin" ? "/System/Library/Fonts/Supplemental" : "/usr/share/fonts/truetype/dejavu";
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
}): string {
  const look = LOOKS[input.style];
  const font = input.font ?? fontFamily();
  const base = input.baseColor || "white";
  const accent = input.accentColor || DEFAULT_ACCENT;
  const lines = wrapHookKeepingStars(input.text);
  const segments = lines.map(parseHighlight);
  const placed = Number.isFinite(input.x) && Number.isFinite(input.y);
  const px = Math.round(FRAME_W * Math.min(0.92, Math.max(0.08, input.x ?? 0.5)));
  const py = Math.round(FRAME_H * Math.min(0.88, Math.max(0.08, input.y ?? look.top)));
  const marginV = placed ? 0 : Math.round(FRAME_H * look.top);
  const head = placed
    ? `{\\an5\\pos(${px},${py})}${headline(segments, base, accent)}`
    : headline(segments, base, accent);
  const startAt = assClock(input.from ?? 0);
  const endAt = assClock(input.to && input.to > (input.from ?? 0) ? input.to : 9 * 3600 + 59 * 60 + 59);
  const events = [`Dialogue: 0,${startAt},${endAt},Head,,0,0,0,,${head}`];
  const listItems = (input.listItems ?? []).map((line) => line.trim()).filter(Boolean).slice(0, LIST_MAX);
  const listCount = listItems.length || Math.min(Math.max(Math.floor(input.listCount ?? 0), 0), LIST_MAX);
  if (listCount > 0) {
    const lineHeight = look.fontsize * look.lineGap;
    const listTop = (placed ? py : marginV) + Math.round(lines.length * lineHeight) + 120;
    const gap = Math.min(140, Math.floor((FRAME_H * 0.62 - listTop) / listCount));
    const stagger = (input.listAt ?? []).some((time) => Number.isFinite(time));
    for (let index = 0; index < listCount; index += 1) {
      const y = listTop + index * gap;
      const number = `${index + 1}.`;
      const words = listItems[index] ? `${number} ${escapeAssText(listItems[index])}` : number;
      const wordAt = Number(input.listAt?.[index]);
      if (stagger && listItems[index] && Number.isFinite(wordAt)) {
        events.push(`Dialogue: 0,${assClock(0)},${assClock(wordAt)},List,,0,0,0,,{\\pos(90,${y})}${number}`);
        events.push(`Dialogue: 0,${assClock(wordAt)},${endAt},List,,0,0,0,,{\\pos(90,${y})}${words}`);
      } else if (stagger) {
        events.push(`Dialogue: 0,${assClock(0)},${endAt},List,,0,0,0,,{\\pos(90,${y})}${number}`);
      } else {
        events.push(`Dialogue: 0,${startAt},${endAt},List,,0,0,0,,{\\pos(90,${y})}${words}`);
      }
    }
  }
  const styleRow = (name: string, size: number, border: 1 | 3, outline: number, shadow: number, align: number, mv: number) =>
    `Style: ${name},${font},${size},${assColor(base)},${assColor(base)},&H00000000&,&HA0000000&,-1,0,0,0,100,100,0,0,${border},${outline},${shadow},${align},60,60,${mv},1`;
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
    styleRow("Head", look.fontsize, look.borderStyle, look.outline, look.shadow, 8, marginV),
    styleRow("List", Math.round(look.fontsize * 0.95), 1, 6, 3, 7, 0),
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
  return `ass=filename=${escapeFilterPath(file)}:fontsdir=${escapeFilterPath(fontsDir())}`;
}

export function escapeFilterPath(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'").replace(/ /g, "\\ ");
}
