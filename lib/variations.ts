export type Variation = {
  speed: number;
  saturation: number;
  contrast: number;
  hue: number;
  crop: number;
  mirror: boolean;
  hookColor: string;
  accentColor: string;
  tintHue: number | null;
  label: string;
};

const STEPS = [1, -1, 0.55, -0.7, 1.15];

/** Sasha's trick: same text, different color, and the platform sees a new video. */
export const HOOK_COLORS = ["white", "yellow", "#5CFF5C", "#FF5C5C"] as const;
/** Color of the *starred* word in a hook line. Base text stays white. */
export const ACCENT_COLORS = ["#5CFF5C", "#FF5C5C", "yellow", "#5CB8FF"] as const;
/** Sasha's colored-light rooms: red, blue, purple, magenta, orange, teal (hue degrees). */
export const TINT_HUES = [0, 220, 280, 320, 30, 170] as const;
/** Longest numbered list that fits under a two-line headline and above the caption block. */
export const LIST_MAX = 10;
const TINT_NAMES = ["red", "blue", "purple", "magenta", "orange", "teal"] as const;

export function variationFor(
  index: number,
  input: {
    speedAmt: number;
    colorAmt: number;
    cropAmt: number;
    mirrorOn?: boolean;
    hookColorOn?: boolean;
    tintOn?: boolean;
  },
): Variation {
  const step = STEPS[index % STEPS.length];
  const speedAmt = Math.max(0, input.speedAmt);
  const colorAmt = Math.max(0, input.colorAmt);
  const cropAmt = Math.max(0, input.cropAmt);
  const speed = speedAmt ? Number((1 + (speedAmt / 100) * step).toFixed(3)) : 1;
  const saturation = colorAmt ? Number((1 + (colorAmt / 100) * step).toFixed(3)) : 1;
  const contrast = colorAmt ? Number((1 + (colorAmt / 200) * Math.abs(step)).toFixed(3)) : 1;
  const hue = colorAmt ? Math.round(colorAmt * step * 1.2) : 0;
  const crop = cropAmt ? Number((cropAmt * Math.abs(step)).toFixed(1)) : 0;
  const mirror = Boolean(input.mirrorOn) && index % 2 === 1;
  const hookColor = input.hookColorOn ? HOOK_COLORS[index % HOOK_COLORS.length] : HOOK_COLORS[0];
  const accentColor = input.hookColorOn ? ACCENT_COLORS[index % ACCENT_COLORS.length] : ACCENT_COLORS[0];
  const tintIndex = index % TINT_HUES.length;
  const tintHue = input.tintOn ? TINT_HUES[tintIndex] : null;
  const bits = [
    speedAmt ? `${Math.round(speed * 100)}% speed` : null,
    colorAmt ? `sat ${saturation.toFixed(2)}` : null,
    crop ? `crop ${crop}%` : null,
    mirror ? "mirrored" : null,
    input.hookColorOn && hookColor !== HOOK_COLORS[0] ? `${hookColor} text` : null,
    tintHue !== null ? `${TINT_NAMES[tintIndex]} wash` : null,
  ].filter(Boolean);
  return {
    speed,
    saturation,
    contrast,
    hue,
    crop,
    mirror,
    hookColor,
    accentColor,
    tintHue,
    label: bits.length ? bits.join(" · ") : "clean",
  };
}

export function parseHookLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function comboCount(hooks: number, bodies: number, ctas: number): number {
  const parts = [hooks, bodies, ctas].filter((count) => count > 0);
  if (parts.length === 0) return 0;
  return parts.reduce((product, count) => product * count, 1);
}

export function outputCount(combos: number, variants: number): number {
  return combos * Math.max(variants, 1);
}

export function plannedMixes(
  hooks: number,
  bodies: number,
  ctas: number,
  allCombos: boolean,
  cap: number,
): number {
  const all = comboCount(hooks, bodies, ctas);
  if (allCombos) return all;
  return Math.min(all, Math.max(Math.floor(cap), 0));
}
