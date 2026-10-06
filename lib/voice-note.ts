export const RECORDED_VOICE_NAME = "voice-note.webm";

/** A new recording replaces the last Voice paragraph and keeps anything she typed above it. */
export function withVoiceTranscript(existing: string, transcript: string): string {
  const spoken = transcript.trim();
  const kept = existing.replace(/(?:\n*Voice:[\s\S]*)+$/, "").trim();
  if (!spoken) return kept;
  return kept ? `${kept}\n\nVoice: ${spoken}` : `Voice: ${spoken}`;
}
