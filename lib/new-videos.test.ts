import { describe, expect, it } from "vitest";
import { titlesForCount, videoTitles } from "@/lib/new-videos";

describe("titlesForCount", () => {
  it("opens one name box per video and keeps names already typed", () => {
    expect(titlesForCount(["Hook", "Banger"], 4)).toEqual(["Hook", "Banger", "", ""]);
    expect(titlesForCount(["Hook", "Banger", "Extra"], 2)).toEqual(["Hook", "Banger"]);
  });

  it("stays between 1 and 40", () => {
    expect(titlesForCount([], 0)).toHaveLength(1);
    expect(titlesForCount([], 80)).toHaveLength(40);
  });
});

describe("videoTitles", () => {
  it("uses each typed name and drops blanks", () => {
    expect(videoTitles(["  Sitescout  ", "", "Canvas"])).toEqual(["Sitescout", "Canvas"]);
  });
});
