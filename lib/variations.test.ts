import { describe, expect, it } from "vitest";
import { comboCount, hookReuseShift, mixStoryNote, outputCount, parseHookLines, plannedMixes, reuseHookTrim, shiftHookTimes, variationFor } from "@/lib/variations";

describe("variationFor", () => {
  it("makes later copies different when amounts are set", () => {
    const first = variationFor(0, { speedAmt: 3, colorAmt: 8, cropAmt: 4 });
    const second = variationFor(1, { speedAmt: 3, colorAmt: 8, cropAmt: 4 });
    expect(first.speed).not.toBe(second.speed);
    expect(first.saturation).not.toBe(second.saturation);
    expect(first.crop).not.toBe(second.crop);
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
    expect(mixStoryNote(1, 3)).toContain("each body");
    expect(mixStoryNote(3, 1)).toContain("Each hook");
    expect(mixStoryNote(3, 3)).toContain("beat later");
  });
});

describe("hook reuse delivery", () => {
  it("leaves the first use alone and starts later uses a beat in", () => {
    expect(hookReuseShift(0, 3)).toBe(0);
    expect(hookReuseShift(1, 3)).toBe(0.2);
    expect(hookReuseShift(2, 3)).toBe(0.4);
    expect(hookReuseShift(8, 3)).toBe(0.6);
    expect(hookReuseShift(2, 0.7)).toBeCloseTo(0.2);
    expect(reuseHookTrim({ start: 1, end: 4 }, 1, 5).trim.start).toBe(1.2);
    expect(shiftHookTimes(0.5, 0.2)).toBe(0.3);
    expect(shiftHookTimes(0.1, 0.2)).toBe(0);
    expect(shiftHookTimes(undefined, 0.2)).toBeUndefined();
  });
});
