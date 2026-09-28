import { describe, expect, it } from "vitest";
import { hookFontFamily, hookFontFile } from "@/lib/hook-font-files";
import { LOOK_TYPE_CLASS, lookFontName } from "@/lib/hook-fonts";
import { FRAME_W, LOOK_METRICS } from "@/lib/list-layout";

describe("look fonts", () => {
  it("previews type at the burn size as a share of the stage width", () => {
    for (const style of ["tiktok", "instagram", "plain"] as const) {
      const cqw = Number(/text-\[([\d.]+)cqw\]/.exec(LOOK_TYPE_CLASS[style])?.[1]);
      expect(cqw).toBeCloseTo((LOOK_METRICS[style].fontsize / FRAME_W) * 100, 2);
    }
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
