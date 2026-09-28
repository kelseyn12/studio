import { mkdtemp, readFile, rm, stat, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { runFfmpeg } from "@/lib/ffmpeg";

export const OPENAI_BILLING_URL = "https://platform.openai.com/settings/organization/billing";
export const NO_CREDITS = "no-credits";
export const LISTEN_TOO_BIG = "listen-too-big";
/** Whisper's upload cap. Phone clips are often just over this; we send a tiny mp3 instead. */
export const WHISPER_FILE_MAX_BYTES = 25 * 1024 * 1024;

/** OpenAI's own warning includes a URL; we used to clip it at "https://". */
export function isNoCredits(message: string): boolean {
  return (
    message === NO_CREDITS ||
    /no credits remaining|exceeded your current quota|insufficient_quota/i.test(message)
  );
}

export function isListenTooBig(message: string): boolean {
  return message === LISTEN_TOO_BIG || /maximum content size limit|26214400/i.test(message);
}

export function openAiFailStatus(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (isNoCredits(message)) return NO_CREDITS;
  if (isListenTooBig(message)) return LISTEN_TOO_BIG;
  return (message || "failed").trim().slice(0, 160);
}

export function openAiUserError(message: string): string {
  if (isNoCredits(message)) return `OpenAI is out of credits. Add some at ${OPENAI_BILLING_URL}`;
  if (isListenTooBig(message)) {
    return "This clip was over Whisper's 25 MB file cap. Generate again — Studio sends only the voice now.";
  }
  return message;
}

function mappedOpenAiError(message: string): Error {
  if (isNoCredits(message)) return new Error(NO_CREDITS);
  if (isListenTooBig(message)) return new Error(LISTEN_TOO_BIG);
  return new Error(message);
}

export function parseTranscript(body: Record<string, unknown>): string {
  const text = String(body.text || "");
  if (text) return text;
  const error = body.error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  throw new Error("Whisper returned no text");
}

export const TRANSCRIBE_MODEL = "gpt-4o-transcribe";

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Mono 16 kHz mp3 Whisper can take. Caller must `dropListenFile` when done. */
export async function audioForListen(inputAbs: string): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "studio-listen-"));
  const abs = path.join(dir, "listen.mp3");
  try {
    await runFfmpeg(["-i", inputAbs, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "64k", abs]);
    const size = (await stat(abs)).size;
    if (size <= 0) throw new Error("empty");
    if (size >= WHISPER_FILE_MAX_BYTES) throw new Error(LISTEN_TOO_BIG);
    return abs;
  } catch (error) {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
    if (error instanceof Error && (error.message === LISTEN_TOO_BIG || isListenTooBig(error.message))) {
      throw new Error(LISTEN_TOO_BIG);
    }
    throw new Error("This clip has no voice to caption.");
  }
}

export async function dropListenFile(abs: string): Promise<void> {
  await rm(path.dirname(abs), { recursive: true, force: true }).catch(() => undefined);
}

export async function transcribeFile(file: File): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Add OPENAI_API_KEY to .env");
  const needsExtract = file.size >= WHISPER_FILE_MAX_BYTES || file.type.startsWith("video/");
  if (!needsExtract) return sendTranscript(file, key);
  const dir = await mkdtemp(path.join(os.tmpdir(), "studio-listen-in-"));
  const input = path.join(dir, "clip");
  await writeFile(input, Buffer.from(await file.arrayBuffer()));
  try {
    const abs = await audioForListen(input);
    try {
      const mp3 = new File([new Uint8Array(await readFile(abs))], "listen.mp3", { type: "audio/mpeg" });
      return await sendTranscript(mp3, key);
    } finally {
      await dropListenFile(abs);
    }
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function sendTranscript(file: File, key: string): Promise<string> {
  const body = new FormData();
  body.set("model", TRANSCRIBE_MODEL);
  body.set("file", file);
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body,
  });
  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const error = payload.error;
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: string }).message)
        : response.statusText;
    throw mappedOpenAiError(message);
  }
  return parseTranscript(payload);
}
