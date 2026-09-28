import { describe, expect, it } from "vitest";
import { buildHookAss, hookEmojiSpots } from "@/lib/ass";
import { chainOverlays, emojiOverlayFilter, emojiPrepFilter } from "@/lib/emoji-overlay";
import { emojiAdvance, hasEmoji, lineEmojiSpots, lineWidthPx, splitEmojiRuns } from "@/lib/hook-emoji";
import { measureTextPx } from "@/lib/font-measure";
import { hookFontFile } from "@/lib/hook-font-files";
import { lookEm } from "@/lib/ass-plate";
import { LOOK_METRICS } from "@/lib/list-layout";

describe("headline emoji", () => {
  it("splits emoji graphemes out of the words", () => {
    expect(splitEmojiRuns("BANGER 💥 wait 🔥")).toEqual([
      { text: "BANGER ", emoji: false },
      { text: "💥", emoji: true },
      { text: " wait ", emoji: false },
      { text: "🔥", emoji: true },
    ]);
    expect(splitEmojiRuns("👩‍💻 code")).toEqual([
      { text: "👩‍💻", emoji: true },
      { text: " code", emoji: false },
    ]);
    expect(hasEmoji("plain words")).toBe(false);
    expect(hasEmoji("🇺🇸 flag")).toBe(true);
  });

  it("measures a line with Noto Emoji advances for the emoji", () => {
    const em = lookEm("tiktok", 82);
    const words = measureTextPx(hookFontFile("tiktok"), "BANGER ", em);
    expect(lineWidthPx("BANGER 💥", "tiktok", em, 82)).toBeCloseTo(words + emojiAdvance("💥", 82), 5);
    // A ZWJ sequence shapes to one glyph, so it counts once.
    expect(emojiAdvance("👩‍💻", 82)).toBe(emojiAdvance("👩", 82));
  });

  it("centres each emoji where libass leaves its advance", () => {
    const em = lookEm("tiktok", 82);
    const spots = lineEmojiSpots("💥 hi 💥", "tiktok", em, 82, 540, 400);
    expect(spots).toHaveLength(2);
    const total = lineWidthPx("💥 hi 💥", "tiktok", em, 82);
    const advance = emojiAdvance("💥", 82);
    expect(spots[0].x).toBeCloseTo(540 - total / 2 + advance / 2, 5);
    expect(spots[1].x).toBeCloseTo(540 + total / 2 - advance / 2, 5);
    expect(spots[0].y).toBe(400);
    expect(spots[0].size).toBeLessThan(advance);
  });

  it("lists spots per wrapped line from the same layout as the events", () => {
    const spots = hookEmojiSpots({ text: "BANGER 💥", style: "tiktok", x: 0.5, y: 0.3 });
    expect(spots).toHaveLength(1);
    const ass = buildHookAss({ text: "BANGER 💥", style: "tiktok", x: 0.5, y: 0.3 });
    const pos = /\\pos\((\d+),(\d+)\)/.exec(ass.split("\n").find((line) => line.startsWith("Dialogue:") && line.includes(",Head,")) ?? "");
    expect(spots[0].y).toBe(Number(pos?.[2]));
    expect(hookEmojiSpots({ text: "no emoji here", style: "tiktok" })).toEqual([]);
    expect(hookEmojiSpots({ text: "BANGER 💥", style: "instagram", x: 0.5, y: 0.3 })[0].size).toBeGreaterThan(spots[0].size);
  });

  it("hands emoji to Noto Emoji, transparent only when colour art is coming", () => {
    const withArt = buildHookAss({ text: "BANGER 💥", style: "tiktok", emojiArt: true });
    expect(withArt).toContain("{\\fnNoto Emoji\\alpha&HFF&}💥{\\fnTikTok Sans\\alpha&H00&}");
    const withoutArt = buildHookAss({ text: "BANGER 💥", style: "instagram" });
    expect(withoutArt).toContain("{\\fnNoto Emoji}💥{\\fnInter Tight}");
    expect(withoutArt).not.toContain("\\alpha");
    expect(buildHookAss({ text: "plain", style: "tiktok" })).not.toContain("Noto Emoji");
  });

  it("scales art to the glyph and shows it for the text window", () => {
    const art = { text: "💥", x: 552.5, y: 576, size: 82, file: "/tmp/1f4a5.png" };
    expect(emojiPrepFilter(3, art, "emoji0_0")).toBe("[3:v]format=rgba,scale=82:82[emoji0_0]");
    expect(emojiOverlayFilter("v0s0", "emoji0_0", "v0", art, 1.5, 4)).toBe(
      "[v0s0][emoji0_0]overlay=512:535:enable='between(t,1.5,4)'[v0]",
    );
    expect(emojiOverlayFilter("a", "b", "c", art)).toContain("between(t,0,36000)");
    expect(chainOverlays("[0:v]null", "v0", [])).toEqual(["[0:v]null[v0]"]);
    expect(
      chainOverlays("[0:v]null", "v0", [
        { prep: "[1:v]format=rgba[logo]", overlay: (from, to) => `[${from}][logo]overlay[${to}]` },
        { prep: "[2:v]scale=82:82[e]", overlay: (from, to) => `[${from}][e]overlay[${to}]` },
      ]),
    ).toEqual(["[0:v]null[v0s0]", "[1:v]format=rgba[logo]", "[v0s0][logo]overlay[v0s1]", "[2:v]scale=82:82[e]", "[v0s1][e]overlay[v0]"]);
    expect(LOOK_METRICS.tiktok.fontsize).toBe(82);
  });
});
