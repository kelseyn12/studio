import { readFile } from "fs/promises";
import path from "path";
import { escapeDrawText, HOOK_FONT } from "@/lib/ffmpeg";

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
export function captionFilters(phrases: CaptionPhrase[], trimStart: number): string[] {
  return phrases
    .map((phrase) => ({
      text: escapeDrawText(phrase.text).toUpperCase(),
      start: Math.max(0, phrase.start - trimStart),
      end: Math.max(0, phrase.end - trimStart),
    }))
    .filter((phrase) => phrase.end > phrase.start && phrase.text.length > 0)
    .map(
      (phrase) =>
        `drawtext=fontfile=${HOOK_FONT}:text='${phrase.text}':fontsize=58:fontcolor=white:borderw=5:bordercolor=black:x=(w-text_w)/2:y=h*0.62:enable='between(t,${phrase.start.toFixed(2)},${phrase.end.toFixed(2)})'`,
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
