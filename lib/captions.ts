import { readFile } from "fs/promises";
import path from "path";
import type { CaptionWord } from "@/lib/captions-math";
import { isNoCredits, NO_CREDITS } from "@/lib/whisper";

export type { CaptionPhrase, CaptionWord } from "@/lib/captions-math";
export {
  applyCaptionLines,
  captionCase,
  captionLines,
  groupWords,
  parseCaptionWords,
  spokenOnClip,
} from "@/lib/captions-math";
export { buildCaptionAss, writeCaptionAss } from "@/lib/caption-ass";

export const CAPTION_MODEL = "whisper-1";

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
    const message = payload.error?.message || response.statusText;
    throw new Error(isNoCredits(message) ? NO_CREDITS : message);
  }
  return (payload.words || []).filter((word) => word.word.trim().length > 0);
}
