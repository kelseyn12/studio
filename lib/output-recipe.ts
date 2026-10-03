import { captionLines, parseCaptionWords, type CaptionWord } from "@/lib/captions-math";
import type { DrawnStyle } from "@/lib/text-style";

export type RecipeClip = {
  id: string;
  hookText: string;
  trimStart: number;
  trimEnd: number | null;
};

export type OutputRecipe = {
  look: DrawnStyle;
  speed: number;
  saturation: number;
  contrast: number;
  hue: number;
  crop: number;
  mirror: boolean;
  hookColor: string;
  accentColor: string;
  hookList: number;
  clips: RecipeClip[];
  trackId: string;
  bodyClipId: string;
  musicLevel: number;
  /** Set once the slider moves in small steps. Older recipes used 0–3. */
  musicSmooth?: boolean;
};

const LOOKS = new Set(["tiktok", "instagram", "plain"]);

/**
 * Licensed tracks peak near full scale. Phone voice on these clips peaks about 25 dB quieter.
 * 0 is barely there. 100 is as loud as the song can be without covering the voice.
 * amix must not normalize, or it cuts the voice in half.
 */
export const MUSIC_LEVEL_MAX = 100;
export const MUSIC_LEVEL_DEFAULT = 40;
const MUSIC_GAIN_QUIET = 0.008;
const MUSIC_GAIN_LOUD = 0.04;
/** The first slider only had four stops. Recipes saved then still use these. */
const LEGACY_LEVELS = [0, 40, 70, 100];

export function musicLevel(value: unknown): number {
  const level = Math.round(Number(value));
  if (!Number.isFinite(level)) return MUSIC_LEVEL_DEFAULT;
  return Math.min(MUSIC_LEVEL_MAX, Math.max(0, level));
}

export function musicLevelFromRecipe(raw: unknown, smooth: unknown): number {
  const level = Math.round(Number(raw));
  if (!Number.isFinite(level)) return MUSIC_LEVEL_DEFAULT;
  if (!smooth && level >= 0 && level <= 3) return LEGACY_LEVELS[level];
  return musicLevel(level);
}

export function musicGainForLevel(value: unknown): number {
  const level = musicLevel(value);
  const quietDb = Math.log10(MUSIC_GAIN_QUIET) * 20;
  const loudDb = Math.log10(MUSIC_GAIN_LOUD) * 20;
  const db = quietDb + (level / MUSIC_LEVEL_MAX) * (loudDb - quietDb);
  return Number(Math.pow(10, db / 20).toFixed(4));
}

export function musicLevelHint(level: number): string {
  if (level < 25) return "Barely there";
  if (level < 55) return "Under your voice";
  if (level < 80) return "A bit louder";
  return "Loudest that still stays under you";
}

/** Starts the song at this second. The video still ends the music when the clip ends. */
export function musicFromPrefix(seconds: number): string {
  const start = Math.max(0, seconds);
  if (start <= 0) return "";
  return `atrim=start=${start.toFixed(3)},asetpts=PTS-STARTPTS,`;
}

/** Voice stays full. The song is quiet and stops when the video stops. */
export function musicMixFilter(musicIndex: number, start: number, gain: number): string {
  return `[${musicIndex}:a]${musicFromPrefix(start)}volume=${musicGainForLevel(gain).toFixed(4)},aresample=44100[mus];[outa][mus]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[mix]`;
}

/** "" keeps the song from Generate. "none" is silence. Anything else is a track id. */
export function chosenTrackId(musicTrackId: string, recipeTrackId: string): string {
  if (musicTrackId === "none") return "";
  if (musicTrackId) return musicTrackId;
  return recipeTrackId;
}

export function parseRecipe(raw: string | null | undefined): OutputRecipe | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<OutputRecipe>;
    if (!parsed.look || !LOOKS.has(parsed.look) || !Array.isArray(parsed.clips) || parsed.clips.length === 0) return null;
    return {
      look: parsed.look,
      speed: Number(parsed.speed) || 1,
      saturation: Number(parsed.saturation) || 1,
      contrast: Number(parsed.contrast) || 1,
      hue: Number(parsed.hue) || 0,
      crop: Number(parsed.crop) || 0,
      mirror: Boolean(parsed.mirror),
      hookColor: parsed.hookColor || "white",
      accentColor: parsed.accentColor || "#5CFF5C",
      hookList: Math.max(0, Math.floor(Number(parsed.hookList) || 0)),
      clips: parsed.clips
        .map((clip) => ({
          id: String(clip?.id || ""),
          hookText: String(clip?.hookText || ""),
          trimStart: Math.max(0, Number(clip?.trimStart) || 0),
          trimEnd: clip?.trimEnd == null ? null : Number(clip.trimEnd),
        }))
        .filter((clip) => clip.id),
      trackId: String(parsed.trackId || ""),
      bodyClipId: String(parsed.bodyClipId || ""),
      musicLevel: musicLevelFromRecipe(parsed.musicLevel, (parsed as { musicSmooth?: boolean }).musicSmooth),
    };
  } catch {
    return null;
  }
}

export function parseCaptionMap(raw: string | null | undefined): Record<string, CaptionWord[]> {
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || Array.isArray(parsed)) return {};
    const map: Record<string, CaptionWord[]> = {};
    for (const [clipId, words] of Object.entries(parsed)) {
      const list = parseCaptionWords(JSON.stringify(words));
      if (list.length) map[clipId] = list;
    }
    return map;
  } catch {
    return {};
  }
}

export function wordsForClip(map: Record<string, CaptionWord[]>, clipId: string, clipCaptions: string): CaptionWord[] {
  return map[clipId]?.length ? map[clipId] : parseCaptionWords(clipCaptions);
}

const SLOT_LABEL: Record<string, string> = { DEMO: "Body", CTA: "CTA" };

export type TuneSection = { clipId: string; label: string; text: string };

export function tuneSections(
  recipe: OutputRecipe,
  clips: Array<{ id: string; slot: string; captionsJson: string }>,
  captionsJson: string,
): TuneSection[] {
  const byId = new Map(clips.map((clip) => [clip.id, clip]));
  const map = parseCaptionMap(captionsJson);
  return recipe.clips.flatMap((row) => {
    const clip = byId.get(row.id);
    const label = SLOT_LABEL[clip?.slot || ""];
    if (!clip || !label) return [];
    return [{ clipId: clip.id, label, text: captionLines(wordsForClip(map, clip.id, clip.captionsJson)) }];
  });
}

export function bodyMates(recipes: Array<string | null | undefined>, bodyClipId: string): number {
  if (!bodyClipId) return 1;
  return recipes.filter((raw) => parseRecipe(raw)?.bodyClipId === bodyClipId).length;
}

/** The second Rebuild button. Do not also require caption words — those live on the clip. */
export function rebuildsEveryBodyMate(scope: string, bodyClipId: string): boolean {
  return scope === "body" && Boolean(bodyClipId);
}
