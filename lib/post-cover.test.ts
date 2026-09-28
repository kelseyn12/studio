import { describe, expect, it } from "vitest";
import { coverMs, coverOptions, postOptions, TIKTOK_POST_MODE, TIKTOK_PRIVACY, wantsCoverUrl } from "@/lib/post-cover";

const cover = { coverPath: "thumbs/covers/a.jpg", coverAt: 2.345 };
const url = "https://media.outstand.so/cover.jpg";
const tiktokLive = { postMode: TIKTOK_POST_MODE, privacyLevel: TIKTOK_PRIVACY };

describe("coverOptions", () => {
  it("sends nothing when the video has no cover", () => {
    expect(coverOptions(["instagram", "tiktok"], { coverPath: "", coverAt: 3 }, url)).toEqual({});
  });

  it("gives Instagram and YouTube the image and TikTok the frame time", () => {
    expect(coverOptions(["instagram", "youtube", "tiktok", "facebook"], cover, url)).toEqual({
      instagram: { reelCoverUrl: url },
      youtube: { thumbnailUrl: url },
      tiktok: { ...tiktokLive, videoCoverTimestampMs: 2345 },
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

describe("postOptions", () => {
  it("auto-publishes TikTok even when no cover is saved", () => {
    expect(postOptions(["tiktok", "youtube"], { coverPath: "", coverAt: 0 }, "")).toEqual({
      tiktok: tiktokLive,
    });
  });

  it("leaves Instagram-only groups without a TikTok block", () => {
    expect(postOptions(["instagram", "facebook"], cover, url).tiktok).toBeUndefined();
  });
});

describe("coverMs", () => {
  it("rounds seconds to whole milliseconds and never goes negative", () => {
    expect(coverMs(0.4)).toBe(400);
    expect(coverMs(-1)).toBe(0);
  });
});
