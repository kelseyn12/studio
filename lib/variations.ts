export type Variation = {
  speed: number;
  saturation: number;
  contrast: number;
  hue: number;
  crop: number;
  mirror: boolean;
  label: string;
};

const STEPS = [1, -1, 0.55, -0.7, 1.15];

export function variationFor(
  index: number,
  input: { speedAmt: number; colorAmt: number; cropAmt: number; mirrorOn?: boolean },
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
  const bits = [
    speedAmt ? `${Math.round(speed * 100)}% speed` : null,
    colorAmt ? `sat ${saturation.toFixed(2)}` : null,
    crop ? `crop ${crop}%` : null,
    mirror ? "mirrored" : null,
  ].filter(Boolean);
  return {
    speed,
    saturation,
    contrast,
    hue,
    crop,
    mirror,
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
