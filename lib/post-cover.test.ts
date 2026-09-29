import { describe, expect, it } from "vitest";
import {
  coverCanChange,
  coverMs,
  coverOptions,
  nextCoverPath,
  postOptions,
  TIKTOK_POST_MODE,
  TIKTOK_PRIVACY,
  wantsCoverUrl,
} from "@/lib/post-cover";

const cover = { coverPath: "thumbs/covers/a.jpg", coverAt: 2.345 };
const url = "https://media.outstand.so/cover.jpg";
const tiktokLive = { postMode: TIKTOK_POST_MODE, privacyLevel: TIKTOK_PRIVACY };

describe("coverOptions", () => {
  it("sends nothing when the video has no cover", () => {
    expect(coverOptions(["instagram", "tiktok"], { coverPath: "", coverAt: 3 }, url)).toEqual({});
  });

  it("gives Instagram the 9:16 image and YouTube the 16:9 thumb", () => {
    expect(
      coverOptions(["instagram", "youtube", "tiktok", "facebook"], cover, url, "https://media.outstand.so/yt.jpg"),
    ).toEqual({
      instagram: { reelCoverUrl: url },
      youtube: { thumbnailUrl: "https://media.outstand.so/yt.jpg" },
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

describe("nextCoverPath", () => {
  it("writes a new file per save so a redo is not the same URL", () => {
    expect(nextCoverPath("a", 1000)).toBe("thumbs/covers/a-1000.jpg");
    expect(nextCoverPath("a", 2000)).not.toBe(nextCoverPath("a", 1000));
  });
});

describe("coverCanChange", () => {
  it("stays open after schedule and closes after it posts", () => {
    expect(coverCanChange("READY")).toBe(true);
    expect(coverCanChange("REVIEW")).toBe(true);
    expect(coverCanChange("POSTED")).toBe(false);
  });
});

describe("coverMs", () => {
  it("rounds seconds to whole milliseconds and never goes negative", () => {
    expect(coverMs(0.4)).toBe(400);
    expect(coverMs(-1)).toBe(0);
  });
});
