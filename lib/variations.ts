export type Variation = {
  speed: number;
  saturation: number;
  contrast: number;
  hue: number;
  crop: number;
  mirror: boolean;
  hookColor: string;
  accentColor: string;
  label: string;
};

const STEPS = [1, -1, 0.55, -0.7, 1.15];
/** Crop cannot follow the signed speed step — abs(1) and abs(-1) were the same zoom on copy 1 and 2. */
const CROP_STEPS = [1, 0.55, 1.15, 0.7, 0.4];

/** Sasha's trick: same text, different color, and the platform sees a new video. */
export const HOOK_COLORS = ["white", "yellow", "#5CFF5C", "#FF5C5C"] as const;
/** Color of the *starred* word in a hook line. Base text stays white. */
export const ACCENT_COLORS = ["#5CFF5C", "#FF5C5C", "yellow", "#5CB8FF"] as const;
/** Longest numbered list that fits under a two-line headline and above the caption block. */
export const LIST_MAX = 10;

export function variationFor(
  index: number,
  input: {
    speedAmt: number;
    colorAmt: number;
    cropAmt: number;
    mirrorOn?: boolean;
    hookColorOn?: boolean;
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
  const crop = cropAmt ? Number((cropAmt * CROP_STEPS[index % CROP_STEPS.length]).toFixed(1)) : 0;
  const mirror = Boolean(input.mirrorOn) && index % 2 === 1;
  const hookColor = input.hookColorOn ? HOOK_COLORS[index % HOOK_COLORS.length] : HOOK_COLORS[0];
  const accentColor = input.hookColorOn ? ACCENT_COLORS[index % ACCENT_COLORS.length] : ACCENT_COLORS[0];
  const bits = [
    speedAmt ? `${Math.round(speed * 100)}% speed` : null,
    colorAmt ? `sat ${saturation.toFixed(2)}` : null,
    crop ? `crop ${crop}%` : null,
    mirror ? "mirrored" : null,
    input.hookColorOn && hookColor !== HOOK_COLORS[0] ? `${hookColor} text` : null,
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

/** Distinct means another filmed hook or body, not a sat/speed copy of the same clips. */
export function mixStoryNote(hooks: number, bodies: number): string {
  if (hooks > 1 && bodies > 1) return "Every hook with every body. Different takes — that is distinct.";
  if (hooks > 1) return "Each hook with the same body. Different openings — that is distinct.";
  if (bodies > 1) return "This hook with each body. Different middles — that is distinct.";
  return "Each mix is one hook + body + CTA. Drop a second hook or body take if you need more than one story.";
}
