import { emojiImage } from "@/lib/emoji-image";
import type { EmojiSpot } from "@/lib/hook-emoji";

/** One colour emoji PNG to draw on the burn: file plus where the headline layout put it. */
export type EmojiArt = EmojiSpot & { file: string };

const ALWAYS_ON = 36000;

/**
 * Colour art for every headline emoji. Null when any PNG is missing (offline, unknown
 * code point) so the ASS track keeps its outline glyphs instead of leaving holes.
 */
export async function emojiArtFor(spots: EmojiSpot[]): Promise<EmojiArt[] | null> {
  if (spots.length === 0) return [];
  const files = await Promise.all(spots.map((spot) => emojiImage(spot.text)));
  if (files.some((file) => !file)) return null;
  return spots.map((spot, index) => ({ ...spot, file: files[index] as string }));
}

/** Scales the PNG input to the glyph size; the label is consumed by `emojiOverlayFilter`. */
export function emojiPrepFilter(inputIndex: number, art: EmojiArt, label: string): string {
  return `[${inputIndex}:v]format=rgba,scale=${art.size}:${art.size}[${label}]`;
}

/** A prepared input plus the overlay that draws it onto the running video label. */
export type OverlayStage = { prep: string; overlay: (from: string, to: string) => string };

/** Runs `source` (an input label plus its filters) through each stage, ending at `[out]`. */
export function chainOverlays(source: string, out: string, stages: OverlayStage[]): string[] {
  let current = stages.length ? `${out}s0` : out;
  const chains = [`${source}[${current}]`];
  stages.forEach((stage, index) => {
    const next = index === stages.length - 1 ? out : `${out}s${index + 1}`;
    chains.push(stage.prep, stage.overlay(current, next));
    current = next;
  });
  return chains;
}

/** Draws the art centred on the spot for the same window the headline text is on screen. */
export function emojiOverlayFilter(baseLabel: string, artLabel: string, outLabel: string, art: EmojiArt, from?: number, to?: number): string {
  const x = Math.round(art.x - art.size / 2);
  const y = Math.round(art.y - art.size / 2);
  const start = from ?? 0;
  const end = to && to > start ? to : ALWAYS_ON;
  return `[${baseLabel}][${artLabel}]overlay=${x}:${y}:enable='between(t,${start},${end})'[${outLabel}]`;
}
