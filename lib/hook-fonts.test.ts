import { describe, expect, it } from "vitest";
import { lineStep, lookEm, plateSize } from "@/lib/ass-plate";
import { emPerAssUnit, measureTextPx } from "@/lib/font-measure";
import { hookFontFamily, hookFontFile } from "@/lib/hook-font-files";
import { LOOK_EM_PX, LOOK_TYPE_CLASS, lookFontName } from "@/lib/hook-fonts";
import { FRAME_W, LOOK_METRICS } from "@/lib/list-layout";

describe("look fonts", () => {
  it("knows the em libass draws for an ASS Fontsize", () => {
    // TikTok Sans: upem 1000, usWinAscent 1118 + usWinDescent 242. Inter Tight: 2048 over 2263 + 654.
    expect(emPerAssUnit(hookFontFile("tiktok"))).toBeCloseTo(1000 / 1360, 4);
    expect(emPerAssUnit(hookFontFile("instagram"))).toBeCloseTo(2048 / 2917, 4);
    expect(emPerAssUnit("/nowhere/missing.ttf")).toBe(1);
    expect(lookEm("tiktok", 82, "Arial")).toBe(82);
  });

  it("previews type at the burn em as a share of the stage width", () => {
    for (const style of ["tiktok", "instagram"] as const) {
      expect(LOOK_EM_PX[style]).toBeCloseTo(lookEm(style, LOOK_METRICS[style].fontsize), 1);
      const cqw = Number(/text-\[([\d.]+)cqw\]/.exec(LOOK_TYPE_CLASS[style])?.[1]);
      expect(cqw).toBeCloseTo((LOOK_EM_PX[style] / FRAME_W) * 100, 2);
    }
    expect(LOOK_TYPE_CLASS.instagram).not.toContain("tracking");
  });

  it("sizes the TikTok card to the words at that em", () => {
    const em = lookEm("tiktok", 82);
    const one = plateSize([measureTextPx(hookFontFile("tiktok"), "Hello there", em)], em);
    expect(one.width).toBe(measureTextPx(hookFontFile("tiktok"), "Hello there", em) + 36);
    expect(one.height).toBe(lineStep(em) + 16);
    expect(plateSize([400, 200], em).height).toBe(2 * lineStep(em) + 16);
    expect(lineStep(60)).toBe(66);
  });

  it("names TikTok Sans and Inter Tight for the two looks", () => {
    expect(lookFontName("tiktok")).toBe("TikTok Sans");
    expect(lookFontName("instagram")).toBe("Inter Tight");
    expect(hookFontFamily("tiktok")).toBe("TikTok Sans");
    expect(hookFontFamily("instagram")).toBe("Inter Tight");
    expect(hookFontFile("tiktok")).toMatch(/TikTokSans-Bold\.ttf$/);
    expect(hookFontFile("instagram")).toMatch(/InterTight-SemiBold\.ttf$/);
  });
});
