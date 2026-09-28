export const OPENAI_BILLING_URL = "https://platform.openai.com/settings/organization/billing";
export const NO_CREDITS = "no-credits";

/** OpenAI's own warning includes a URL; we used to clip it at "https://". */
export function isNoCredits(message: string): boolean {
  return (
    message === NO_CREDITS ||
    /no credits remaining|exceeded your current quota|insufficient_quota/i.test(message)
  );
}

export function openAiFailStatus(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (isNoCredits(message)) return NO_CREDITS;
  return (message || "failed").trim().slice(0, 160);
}

export function openAiUserError(message: string): string {
  if (isNoCredits(message)) return `OpenAI is out of credits. Add some at ${OPENAI_BILLING_URL}`;
  return message;
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

export async function transcribeFile(file: File): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Add OPENAI_API_KEY to .env");
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
    throw new Error(isNoCredits(message) ? NO_CREDITS : message);
  }
  return parseTranscript(payload);
}
