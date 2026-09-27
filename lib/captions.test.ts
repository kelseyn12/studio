import { describe, expect, it } from "vitest";
import { applyCaptionLines, buildCaptionAss, groupWords, parseCaptionWords } from "@/lib/captions";
import { captionCase, spokenOnClip } from "@/lib/captions-math";

describe("groupWords", () => {
  it("groups up to three words into a phrase", () => {
    const phrases = groupWords([
      { word: "this", start: 0, end: 0.2 },
      { word: "app", start: 0.2, end: 0.4 },
      { word: "is", start: 0.4, end: 0.5 },
      { word: "insane", start: 0.5, end: 0.9 },
    ]);
    expect(phrases).toHaveLength(2);
    expect(phrases[0]?.text).toBe("this app is");
    expect(phrases[0]?.start).toBe(0);
    expect(phrases[0]?.end).toBe(0.5);
    expect(phrases[0]?.words).toHaveLength(3);
    expect(phrases[1]?.text).toBe("insane");
  });

  it("starts a new phrase after a long pause", () => {
    const phrases = groupWords([
      { word: "wait", start: 0, end: 0.3 },
      { word: "what", start: 1.5, end: 1.8 },
    ]);
    expect(phrases).toHaveLength(2);
  });

  it("keeps phrases short enough for the frame", () => {
    const phrases = groupWords([
      { word: "unbelievably", start: 0, end: 0.5 },
      { word: "extraordinary", start: 0.5, end: 1 },
    ]);
    expect(phrases.length).toBe(2);
  });
});

describe("applyCaptionLines", () => {
  it("keeps the old clocks when you rewrite a phrase", () => {
    const words = [
      { word: "this", start: 0, end: 0.2 },
      { word: "app", start: 0.2, end: 0.4 },
      { word: "is", start: 0.4, end: 0.5 },
    ];
    const next = applyCaptionLines(words, "this tool works");
    expect(next[0]?.start).toBe(0);
    expect(next[next.length - 1]?.end).toBe(0.5);
    expect(next.map((item) => item.word).join(" ")).toBe("this tool works");
  });
});

describe("buildCaptionAss", () => {
  it("shifts times by the trim and keeps spoken case", () => {
    const track = buildCaptionAss([{ text: "this app is", start: 1, end: 1.5 }], 0.4);
    expect(track).toContain("this app is");
    expect(track).not.toContain("THIS APP IS");
    expect(track).toContain("0:00:00.60");
    expect(track).toContain("0:00:01.10");
  });

  it("drops phrases fully cut off by the trim", () => {
    const track = buildCaptionAss([{ text: "gone", start: 0, end: 0.3 }], 0.5);
    expect(track).not.toContain("gone");
  });

  it("paints both looks as white stroke, IG thinner and TT fatter", () => {
    const phrase = { text: "hello there", start: 0, end: 1 };
    const instagram = buildCaptionAss([phrase], 0, "instagram");
    const tiktok = buildCaptionAss([phrase], 0, "tiktok");
    expect(instagram).toContain(",1,7,0,5,");
    expect(instagram).toContain("Inter Tight");
    expect(instagram).not.toContain(",3,");
    expect(tiktok).toContain(",1,9,0,5,");
    expect(tiktok).toContain("TikTok Sans");
    expect(tiktok).not.toContain("&H00FFFF&");
  });
});

describe("spokenOnClip", () => {
  it("skips hooks and keeps bodies and CTAs", () => {
    expect(spokenOnClip("HOOK")).toBe(false);
    expect(spokenOnClip("DEMO")).toBe(true);
    expect(spokenOnClip("CTA")).toBe(true);
  });
});

describe("captionCase", () => {
  it("capitals the first letter only", () => {
    expect(captionCase("this app is")).toBe("This app is");
  });
});

describe("parseCaptionWords", () => {
  it("survives bad json and filters junk", () => {
    expect(parseCaptionWords("")).toEqual([]);
    expect(parseCaptionWords("not json")).toEqual([]);
    expect(
      parseCaptionWords(JSON.stringify([{ word: "hi", start: 0, end: 0.2 }, { word: 3 }])),
    ).toEqual([{ word: "hi", start: 0, end: 0.2 }]);
  });
});
