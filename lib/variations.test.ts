import { describe, expect, it } from "vitest";
import { comboCount, outputCount, parseHookLines, plannedMixes, variationFor } from "@/lib/variations";

describe("variationFor", () => {
  it("makes later copies different when amounts are set", () => {
    const first = variationFor(0, { speedAmt: 3, colorAmt: 8, cropAmt: 4 });
    const second = variationFor(1, { speedAmt: 3, colorAmt: 8, cropAmt: 4 });
    expect(first.speed).not.toBe(second.speed);
    expect(first.saturation).not.toBe(second.saturation);
    expect(first.crop).toBeGreaterThan(0);
  });

  it("stays clean when sliders are at zero", () => {
    const clean = variationFor(3, { speedAmt: 0, colorAmt: 0, cropAmt: 0 });
    expect(clean.speed).toBe(1);
    expect(clean.saturation).toBe(1);
    expect(clean.crop).toBe(0);
    expect(clean.mirror).toBe(false);
    expect(clean.label).toBe("clean");
  });

  it("mirrors every second copy when mirror is on", () => {
    const first = variationFor(0, { speedAmt: 0, colorAmt: 0, cropAmt: 0, mirrorOn: true });
    const second = variationFor(1, { speedAmt: 0, colorAmt: 0, cropAmt: 0, mirrorOn: true });
    expect(first.mirror).toBe(false);
    expect(second.mirror).toBe(true);
    expect(second.label).toContain("mirrored");
  });

  it("cycles text color per copy when the toggle is on", () => {
    const base = { speedAmt: 0, colorAmt: 0, cropAmt: 0, hookColorOn: true };
    const colors = [0, 1, 2, 3, 4].map((index) => variationFor(index, base).hookColor);
    expect(colors[0]).toBe("white");
    expect(new Set(colors.slice(0, 4)).size).toBe(4);
    expect(colors[4]).toBe(colors[0]);
    const off = variationFor(2, { speedAmt: 0, colorAmt: 0, cropAmt: 0 });
    expect(off.hookColor).toBe("white");
    expect(off.accentColor).toBe("#5CFF5C");
    expect(variationFor(1, base).accentColor).toBe("#FF5C5C");
  });

  it("walks the color wash palette per copy only when tint is on", () => {
    const base = { speedAmt: 0, colorAmt: 0, cropAmt: 0, tintAmt: 40 };
    const hues = [0, 1, 2, 3, 4, 5, 6].map((index) => variationFor(index, base).tintHue);
    expect(hues.slice(0, 6)).toEqual([0, 220, 280, 320, 30, 170]);
    expect(hues[6]).toBe(0);
    expect(variationFor(1, base).label).toBe("blue wash 40%");
    expect(variationFor(1, base).tintMix).toBe(0.4);
    expect(variationFor(1, { ...base, tintAmt: 0 }).tintHue).toBeNull();
    expect(variationFor(1, { ...base, tintAmt: 90 }).tintMix).toBe(0.6);
  });
});

describe("parseHookLines", () => {
  it("splits lines, trims, drops blanks", () => {
    expect(parseHookLines("one\n\n  two  \nthree\n")).toEqual(["one", "two", "three"]);
    expect(parseHookLines("")).toEqual([]);
  });
});

describe("recipe math", () => {
  it("multiplies filled slots only", () => {
    expect(comboCount(3, 1, 2)).toBe(6);
    expect(comboCount(4, 0, 2)).toBe(8);
    expect(outputCount(6, 2)).toBe(12);
    expect(plannedMixes(3, 1, 2, true, 2)).toBe(6);
    expect(plannedMixes(3, 1, 2, false, 2)).toBe(2);
  });
});
