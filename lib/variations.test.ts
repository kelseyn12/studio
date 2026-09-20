import { describe, expect, it } from "vitest";
import { comboCount, outputCount, plannedMixes, variationFor } from "@/lib/variations";

describe("variationFor", () => {
  it("makes later copies different when speed is on", () => {
    const first = variationFor(0, { speedOn: true, colorOn: false, zoomOn: false, intensity: "light" });
    const second = variationFor(1, { speedOn: true, colorOn: false, zoomOn: false, intensity: "light" });
    expect(first.speed).not.toBe(second.speed);
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
