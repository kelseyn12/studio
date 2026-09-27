import { describe, expect, it } from "vitest";
import { applyCaptionLines, captionFilters, groupWords, parseCaptionWords } from "@/lib/captions";

describe("groupWords", () => {
  it("groups up to three words into a phrase", () => {
    const phrases = groupWords([
      { word: "this", start: 0, end: 0.2 },
      { word: "app", start: 0.2, end: 0.4 },
      { word: "is", start: 0.4, end: 0.5 },
      { word: "insane", start: 0.5, end: 0.9 },
    ]);
    expect(phrases).toHaveLength(2);
    expect(phrases[0]).toEqual({ text: "this app is", start: 0, end: 0.5 });
    expect(phrases[1]).toEqual({ text: "insane", start: 0.5, end: 0.9 });
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

describe("captionFilters", () => {
  it("shifts times by the trim and uppercases", () => {
    const [filter] = captionFilters([{ text: "this app is", start: 1, end: 1.5 }], 0.4);
    expect(filter).toContain("THIS APP IS");
    expect(filter).toContain("between(t,0.60,1.10)");
  });

  it("drops phrases fully cut off by the trim", () => {
    const filters = captionFilters([{ text: "gone", start: 0, end: 0.3 }], 0.5);
    expect(filters).toHaveLength(0);
  });

  it("draws Instagram spoken words in a box and TikTok words with a shadow", () => {
    const instagram = captionFilters([{ text: "hello", start: 0, end: 1 }], 0, "instagram")[0];
    const tiktok = captionFilters([{ text: "hello", start: 0, end: 1 }], 0, "tiktok")[0];
    expect(instagram).toContain("box=1");
    expect(instagram).toContain("InterTight-SemiBold.ttf");
    expect(tiktok).toContain("shadowx=3");
    expect(tiktok).toContain("TikTokSans-Bold.ttf");
    expect(tiktok).not.toContain("box=1");
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
