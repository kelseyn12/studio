export type Variation = {
  speed: number;
  saturation: number;
  contrast: number;
  hue: number;
  zoom: boolean;
  label: string;
};

const LIGHT_SPEEDS = [1, 1.02, 0.98, 1.03, 0.97];
const HARD_SPEEDS = [1, 1.05, 0.95, 1.06, 0.94];
const LIGHT_SAT = [1, 1.06, 0.94, 1.1, 0.9];
const HARD_SAT = [1, 1.14, 0.86, 1.18, 0.82];
const HUES = [0, 8, -8, 14, -12];

export function variationFor(index: number, input: {
  speedOn: boolean;
  colorOn: boolean;
  zoomOn: boolean;
  intensity: string;
}): Variation {
  const hard = input.intensity === "hard";
  const speeds = hard ? HARD_SPEEDS : LIGHT_SPEEDS;
  const sats = hard ? HARD_SAT : LIGHT_SAT;
  const speed = input.speedOn ? speeds[index % speeds.length] : 1;
  const saturation = input.colorOn ? sats[index % sats.length] : 1;
  const hue = input.colorOn ? HUES[index % HUES.length] : 0;
  const zoom = input.zoomOn ? index % 2 === 1 : false;
  const bits = [
    input.speedOn ? `${Math.round(speed * 100)}%` : null,
    input.colorOn ? `sat ${saturation.toFixed(2)}` : null,
    zoom ? "crop" : null,
  ].filter(Boolean);
  return {
    speed,
    saturation,
    contrast: input.colorOn ? (hard ? 1.06 : 1.03) : 1,
    hue,
    zoom,
    label: bits.length ? bits.join(" · ") : "clean",
  };
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
