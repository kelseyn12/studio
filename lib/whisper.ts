export function parseTranscript(body: Record<string, unknown>): string {
  const text = String(body.text || "");
  if (text) return text;
  const error = body.error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  throw new Error("Whisper returned no text");
}

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function transcribeFile(file: File): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Add OPENAI_API_KEY to .env");
  const body = new FormData();
  body.set("model", "whisper-1");
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
    throw new Error(message);
  }
  return parseTranscript(payload);
}
