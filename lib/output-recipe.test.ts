import { describe, expect, it } from "vitest";
import { bodyMates, chosenTrackId, musicFromPrefix, musicLevel, musicMixFilter, parseRecipe, rebuildsEveryBodyMate, tuneSections } from "@/lib/output-recipe";

const recipe = {
  look: "tiktok" as const,
  speed: 1,
  saturation: 1,
  contrast: 1,
  hue: 0,
  crop: 0,
  mirror: false,
  hookColor: "white",
  accentColor: "#5CFF5C",
  hookList: 0,
  clips: [
    { id: "hook", hookText: "Hi", trimStart: 0, trimEnd: null },
    { id: "body", hookText: "", trimStart: 0.2, trimEnd: 4 },
  ],
  trackId: "song",
  bodyClipId: "body",
};

describe("output recipe", () => {
  it("starts the song at the chosen second", () => {
    expect(musicFromPrefix(0)).toBe("");
    expect(musicFromPrefix(12.5)).toBe("atrim=start=12.500,asetpts=PTS-STARTPTS,");
  });

  it("lets the song slider land anywhere from quiet to just under the voice", () => {
    expect(musicLevel(undefined)).toBe(40);
    expect(musicLevel(-3)).toBe(0);
    expect(musicLevel(20)).toBe(20);
    expect(musicLevel(140)).toBe(100);
    expect(musicMixFilter(4, 0, 0)).toContain("volume=0.0080");
    expect(musicMixFilter(4, 0, 100)).toContain("volume=0.0400");
    expect(musicMixFilter(4, 0, 40)).toContain("normalize=0");
    const mid = Number(musicMixFilter(4, 0, 40).match(/volume=([\d.]+)/)?.[1]);
    expect(mid).toBeGreaterThan(0.012);
    expect(mid).toBeLessThan(0.02);
    expect(musicMixFilter(4, 8, 40)).toContain("atrim=start=8.000");
    expect(parseRecipe(JSON.stringify({ ...recipe, musicLevel: 1 }))?.musicLevel).toBe(40);
    expect(parseRecipe(JSON.stringify({ ...recipe, musicLevel: 12, musicSmooth: true }))?.musicLevel).toBe(12);
  });

  it("treats a blank music choice as the song from Generate", () => {
    expect(chosenTrackId("", "song")).toBe("song");
    expect(chosenTrackId("none", "song")).toBe("");
    expect(chosenTrackId("other", "song")).toBe("other");
  });

  it("round-trips a recipe and skips the hook in the word list", () => {
    const parsed = parseRecipe(JSON.stringify(recipe));
    expect(parsed?.clips[1]?.trimEnd).toBe(4);
    expect(parsed?.bodyClipId).toBe("body");
    const sections = tuneSections(parsed!, [{ id: "body", slot: "DEMO", captionsJson: "" }], "");
    expect(sections).toEqual([{ clipId: "body", label: "Body", text: "" }]);
  });

  it("counts videos that share a body", () => {
    expect(bodyMates([JSON.stringify(recipe), JSON.stringify(recipe), ""], "body")).toBe(2);
  });

  it("rebuilds every mate from the body button even when this row has no word edits yet", () => {
    expect(rebuildsEveryBodyMate("body", "body")).toBe(true);
    expect(rebuildsEveryBodyMate("body", "")).toBe(false);
    expect(rebuildsEveryBodyMate("one", "body")).toBe(false);
  });
});
