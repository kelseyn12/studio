import { describe, expect, it } from "vitest";
import { hookFontFamily, hookFontFile } from "@/lib/hook-font-files";
import { lookFontName } from "@/lib/hook-fonts";

describe("look fonts", () => {
  it("names TikTok Sans and Inter Tight for the two looks", () => {
    expect(lookFontName("tiktok")).toBe("TikTok Sans");
    expect(lookFontName("instagram")).toBe("Inter Tight");
    expect(hookFontFamily("tiktok")).toBe("TikTok Sans");
    expect(hookFontFamily("instagram")).toBe("Inter Tight");
    expect(hookFontFile("tiktok")).toMatch(/TikTokSans-Bold\.ttf$/);
    expect(hookFontFile("instagram")).toMatch(/InterTight-SemiBold\.ttf$/);
  });
});
