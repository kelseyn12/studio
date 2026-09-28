import { describe, expect, it } from "vitest";
import { coverMs, coverOptions, wantsCoverUrl } from "@/lib/post-cover";

const cover = { coverPath: "thumbs/covers/a.jpg", coverAt: 2.345 };
const url = "https://media.outstand.so/cover.jpg";

describe("coverOptions", () => {
  it("sends nothing when the video has no cover", () => {
    expect(coverOptions(["instagram", "tiktok"], { coverPath: "", coverAt: 3 }, url)).toEqual({});
  });

  it("gives Instagram and YouTube the image and TikTok the frame time", () => {
    expect(coverOptions(["instagram", "youtube", "tiktok", "facebook"], cover, url)).toEqual({
      instagram: { reelCoverUrl: url },
      youtube: { thumbnailUrl: url },
      tiktok: { videoCoverTimestampMs: 2345 },
    });
  });

  it("falls back to the frame offset on Instagram when no public image exists", () => {
    expect(coverOptions(["Instagram", "youtube"], cover, "")).toEqual({
      instagram: { reelThumbOffset: 2345 },
    });
  });

  it("leaves Facebook alone", () => {
    expect(coverOptions(["facebook"], cover, url)).toEqual({});
  });
});

describe("wantsCoverUrl", () => {
  it("only asks for an image when an app can take one", () => {
    expect(wantsCoverUrl(["tiktok", "facebook"])).toBe(false);
    expect(wantsCoverUrl(["tiktok", "YouTube"])).toBe(true);
  });
});

describe("coverMs", () => {
  it("rounds seconds to whole milliseconds and never goes negative", () => {
    expect(coverMs(0.4)).toBe(400);
    expect(coverMs(-1)).toBe(0);
  });
});
