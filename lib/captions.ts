import { readFile } from "fs/promises";
import path from "path";
import { hookFontFile } from "@/lib/hook-font-files";
import { escapeDrawText } from "@/lib/ffmpeg";
import type { DrawnStyle } from "@/lib/text-style";
import type { CaptionPhrase, CaptionWord } from "@/lib/captions-math";

export type { CaptionPhrase, CaptionWord } from "@/lib/captions-math";
export { applyCaptionLines, captionLines, groupWords, parseCaptionWords } from "@/lib/captions-math";

export const CAPTION_MODEL = "whisper-1";

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
        `drawtext=fontfile='${hookFontFile(style).replace(/'/g, "\\'")}'`,
        `text='${phrase.text}'`,
        ...look,
        "x=(w-text_w)/2",
        `enable='between(t,${phrase.start.toFixed(2)},${phrase.end.toFixed(2)})'`,
      ].join(":"),
    );
}

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
