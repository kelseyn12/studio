export type CaptionWord = { word: string; start: number; end: number };
export type CaptionPhrase = { text: string; start: number; end: number; words?: CaptionWord[] };

/** Hooks keep Words only. Spoken captions burn on bodies and CTAs. */
export function spokenOnClip(slot?: string | null): boolean {
  return slot !== "HOOK";
}

/** CapCut chunks start with a capital; the rest stays as Whisper said it. */
export function captionCase(text: string): string {
  const trimmed = text.trim();
  const index = trimmed.search(/[A-Za-z]/);
  if (index < 0) return trimmed;
  return trimmed.slice(0, index) + trimmed[index].toUpperCase() + trimmed.slice(index + 1);
}

const PHRASE_MAX_WORDS = 3;
const PHRASE_MAX_CHARS = 22;
const PHRASE_GAP_SECONDS = 0.6;
const MAX_PHRASES_PER_CLIP = 80;

export function groupWords(words: CaptionWord[]): CaptionPhrase[] {
  const phrases: CaptionPhrase[] = [];
  let current: CaptionWord[] = [];
  const flush = () => {
    if (current.length === 0) return;
    phrases.push({
      text: current.map((word) => word.word.trim()).join(" "),
      start: current[0].start,
      end: current[current.length - 1].end,
      words: current.map((word) => ({ word: word.word.trim(), start: word.start, end: word.end })),
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

export function captionLines(words: CaptionWord[]): string {
  return groupWords(words).map((phrase) => phrase.text).join("\n");
}

/** Keep each phrase's clock; replace the words. Extra lines start after the last clock. */
export function applyCaptionLines(words: CaptionWord[], raw: string): CaptionWord[] {
  const old = groupWords(words);
  const lines = raw.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, MAX_PHRASES_PER_CLIP);
  return lines.flatMap((text, index) => {
    const parts = text.split(/\s+/).filter(Boolean);
    const start = old[index]?.start ?? (index === 0 ? 0 : (old[old.length - 1]?.end ?? index * 0.8));
    const end = old[index]?.end ?? start + Math.max(0.4, parts.length * 0.25);
    const span = Math.max(0.2, end - start);
    return parts.map((word, wordIndex) => ({
      word,
      start: start + (wordIndex / parts.length) * span,
      end: start + ((wordIndex + 1) / parts.length) * span,
    }));
  });
}
