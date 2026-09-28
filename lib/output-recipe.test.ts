import { describe, expect, it } from "vitest";
import { bodyMates, chosenTrackId, musicDelayPrefix, parseRecipe, rebuildsEveryBodyMate, tuneSections } from "@/lib/output-recipe";

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
  it("delays music only when the start is past zero", () => {
    expect(musicDelayPrefix(0)).toBe("");
    expect(musicDelayPrefix(3.2)).toBe("adelay=3200|3200,");
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
