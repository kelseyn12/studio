import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { runCommand, runFfmpeg, ffprobeBin } from "@/lib/ffmpeg";
import { localRoot } from "@/lib/files";
import { YOUTUBE_THUMB_FILTER, withoutEditLists, writeYoutubeThumb } from "@/lib/ship-media";

describe("YOUTUBE_THUMB_FILTER", () => {
  it("fits the 9:16 cover on a 1280×720 canvas", () => {
    expect(YOUTUBE_THUMB_FILTER).toContain("1280:720");
    expect(YOUTUBE_THUMB_FILTER).toContain("pad=1280:720");
  });
});

describe("ship media", () => {
  it(
    "strips edit lists and writes a 1280×720 YouTube thumb",
    async () => {
      const dir = await mkdtemp(path.join(os.tmpdir(), "studio-ship-"));
      const clip = path.join(dir, "clip.mp4");
      const cover = path.join(dir, "cover.jpg");
      await runFfmpeg([
        "-f",
        "lavfi",
        "-i",
        "color=c=red:s=1080x1920:d=0.4",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=440:duration=0.4",
        "-pix_fmt",
        "yuv420p",
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        clip,
      ]);
      await withoutEditLists(clip);
      const probe = await runCommand(ffprobeBin(), [
        "-v",
        "error",
        "-show_entries",
        "format=format_name:stream=codec_name,width,height",
        "-of",
        "json",
        clip,
      ]);
      expect(probe).toContain("h264");
      await runFfmpeg(["-i", clip, "-vframes", "1", "-q:v", "3", cover]);
      const rel = `thumbs/yt-${Date.now()}.jpg`;
      const written = await writeYoutubeThumb(cover, rel);
      expect(written).toBe(rel);
      const thumbProbe = await runCommand(ffprobeBin(), [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "csv=p=0",
        path.join(localRoot(), rel),
      ]);
      expect(thumbProbe.trim()).toBe("1280,720");
      await rm(dir, { recursive: true, force: true });
      await rm(path.join(localRoot(), rel), { force: true });
    },
    30_000,
  );
});
