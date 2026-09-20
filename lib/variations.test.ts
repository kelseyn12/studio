import { describe, expect, it } from "vitest";
import { comboCount, outputCount, plannedMixes, variationFor } from "@/lib/variations";

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
    expect(clean.label).toBe("clean");
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
