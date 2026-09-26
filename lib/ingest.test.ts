import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";
import { runFfmpeg } from "@/lib/ffmpeg";
import { ingestClip, needsShrink, parseVideoSize, shrinkClip, shrinkScaleFilter, UNREADABLE_CLIP, videoSize } from "@/lib/ingest";

describe("ingest sizing", () => {
  it("only shrinks clips sharper than 1080 on the short side", () => {
    expect(needsShrink({ width: 2160, height: 3840 })).toBe(true);
    expect(needsShrink({ width: 3840, height: 2160 })).toBe(true);
    expect(needsShrink({ width: 1080, height: 1920 })).toBe(false);
    expect(needsShrink({ width: 720, height: 1280 })).toBe(false);
    expect(needsShrink({ width: 0, height: 0 })).toBe(false);
  });

  it("scales the short side to 1080 for either orientation", () => {
    expect(shrinkScaleFilter({ width: 2160, height: 3840 })).toBe("scale=1080:-2");
    expect(shrinkScaleFilter({ width: 3840, height: 2160 })).toBe("scale=-2:1080");
  });

  it("parses ffprobe output", () => {
    expect(parseVideoSize("2160x3840\n")).toEqual({ width: 2160, height: 3840 });
    expect(parseVideoSize("")).toEqual({ width: 0, height: 0 });
  });
});

describe("ingest shrink with real ffmpeg", () => {
  let dir = "";
  afterAll(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it(
    "turns a 4K vertical clip into 1080x1920",
    async () => {
      dir = await mkdtemp(path.join(os.tmpdir(), "studio-ingest-"));
      const clip = path.join(dir, "phone.mp4");
      await runFfmpeg(["-f", "lavfi", "-i", "color=c=gray:s=2160x3840:d=0.5", "-pix_fmt", "yuv420p", clip]);
      const before = await videoSize(clip);
      expect(needsShrink(before)).toBe(true);
      const bytes = await shrinkClip(clip, before);
      expect(bytes).toBeGreaterThan(0);
      expect(await videoSize(clip)).toEqual({ width: 1080, height: 1920 });
    },
    60_000,
  );

  it("refuses a file that is not a video", async () => {
    const junk = new File([Buffer.alloc(4096, 7)], "not-a-video.mp4", { type: "video/mp4" });
    await expect(ingestClip(junk, `ingest-test/${Date.now()}`)).rejects.toThrow(UNREADABLE_CLIP);
  });
});
