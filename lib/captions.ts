import { readFile } from "fs/promises";
import path from "path";
import { escapeDrawText, HOOK_FONT } from "@/lib/ffmpeg";
import type { DrawnStyle } from "@/lib/text-style";

export type CaptionWord = { word: string; start: number; end: number };
export type CaptionPhrase = { text: string; start: number; end: number };

/** Words per on-screen phrase. Short bursts read best at speed. */
const PHRASE_MAX_WORDS = 3;
/** Characters per phrase so text never spills off a 1080-wide frame. */
const PHRASE_MAX_CHARS = 22;
/** A pause longer than this starts a new phrase. */
const PHRASE_GAP_SECONDS = 0.6;
/** Safety cap so one talky clip cannot build an absurd ffmpeg filter. */
const MAX_PHRASES_PER_CLIP = 80;

/** Timestamps need this model — the plain transcriber model has no word timing. */
export const CAPTION_MODEL = "whisper-1";

export function groupWords(words: CaptionWord[]): CaptionPhrase[] {
  const phrases: CaptionPhrase[] = [];
  let current: CaptionWord[] = [];
  const flush = () => {
    if (current.length === 0) return;
    phrases.push({
      text: current.map((word) => word.word.trim()).join(" "),
      start: current[0].start,
      end: current[current.length - 1].end,
    });
    current = [];
  };
  for (const word of words) {
    const last = current[current.length - 1];
    const chars = current.reduce((sum, item) => sum + item.word.trim().length + 1, 0);
    if (
      current.length >= PHRASE_MAX_WORDS ||
      chars + word.word.trim().length > PHRASE_MAX_CHARS ||
      (last && word.start - last.end > PHRASE_GAP_SECONDS)
    ) {
      flush();
    }
    current.push(word);
  }
  flush();
  return phrases.slice(0, MAX_PHRASES_PER_CLIP);
}

/**
 * One ffmpeg drawtext per phrase, shown only while that phrase is spoken.
 * trimStart shifts times when dead air was cut off the front of the clip.
 * These run before the speed filter, so speed changes keep captions in sync.
 */
const CAPTION_LOOK: Record<DrawnStyle, string[]> = {
  tiktok: ["fontsize=56", "fontcolor=white", "borderw=2", "bordercolor=black@0.85", "shadowcolor=black@0.55", "shadowx=3", "shadowy=3", "y=h*0.62"],
  instagram: ["fontsize=52", "fontcolor=white", "box=1", "boxcolor=black@0.62", "boxborderw=14", "y=h*0.64"],
  plain: ["fontsize=58", "fontcolor=white", "borderw=5", "bordercolor=black", "y=h*0.62"],
};

export function captionFilters(phrases: CaptionPhrase[], trimStart: number, style: DrawnStyle = "plain"): string[] {
  const look = CAPTION_LOOK[style];
  return phrases
    .map((phrase) => ({
      text: escapeDrawText(phrase.text).toUpperCase(),
      start: Math.max(0, phrase.start - trimStart),
      end: Math.max(0, phrase.end - trimStart),
    }))
    .filter((phrase) => phrase.end > phrase.start && phrase.text.length > 0)
    .map((phrase) =>
      [
        `drawtext=fontfile=${HOOK_FONT}`,
        `text='${phrase.text}'`,
        ...look,
        "x=(w-text_w)/2",
        `enable='between(t,${phrase.start.toFixed(2)},${phrase.end.toFixed(2)})'`,
      ].join(":"),
    );
}

export function parseCaptionWords(raw: string): CaptionWord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => item as CaptionWord)
      .filter(
        (item) =>
          typeof item.word === "string" && Number.isFinite(item.start) && Number.isFinite(item.end),
      );
  } catch {
    return [];
  }
}

/** Whisper with word timestamps for one local clip. Returns [] when the clip has no speech. */
export async function transcribeWords(fileAbs: string): Promise<CaptionWord[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Add OPENAI_API_KEY to .env for spoken captions");
  const buffer = await readFile(fileAbs);
  const body = new FormData();
  body.set("model", CAPTION_MODEL);
  body.set("response_format", "verbose_json");
  body.append("timestamp_granularities[]", "word");
  body.set("file", new File([new Uint8Array(buffer)], path.basename(fileAbs), { type: "video/mp4" }));
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body,
  });
  const payload = (await response.json()) as { words?: CaptionWord[]; error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || response.statusText);
  }
  return (payload.words || []).filter((word) => word.word.trim().length > 0);
}
