import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { runFfmpeg } from "@/lib/ffmpeg";
import { cutVideo } from "@/lib/cut";
import { isPlayableCut, keepRanges, parseDrops, parseSpeed, speedAudioFilter, speedVideoFilter } from "@/lib/cut-math";
import { ffprobeBin, runCommand } from "@/lib/ffmpeg";
import { clipDuration } from "@/lib/trim";

async function streamDuration(file: string, kind: "v:0" | "a:0"): Promise<number> {
  const out = await runCommand(ffprobeBin(), [
    "-v",
    "error",
    "-select_streams",
    kind,
    "-show_entries",
    "stream=duration",
    "-of",
    "csv=p=0",
    file,
  ]);
  return Number(out.trim()) || 0;
}

describe("keepRanges", () => {
  it("keeps the whole window when nothing is dropped", () => {
    expect(keepRanges({ start: 0, end: 10 }, [])).toEqual([{ start: 0, end: 10 }]);
  });

  it("splits around a dragging middle", () => {
    expect(keepRanges({ start: 0, end: 10 }, [{ start: 3, end: 5 }])).toEqual([
      { start: 0, end: 3 },
      { start: 5, end: 10 },
    ]);
  });

  it("merges overlapping drops and clips them to the keep window", () => {
    expect(
      keepRanges({ start: 1, end: 9 }, [
        { start: 0, end: 2.5 },
        { start: 2, end: 4 },
        { start: 8.5, end: 20 },
      ]),
    ).toEqual([
      { start: 4, end: 8.5 },
    ]);
  });

  it("returns nothing when the drops eat the keep window", () => {
    expect(keepRanges({ start: 0, end: 4 }, [{ start: 0, end: 4 }])).toEqual([]);
    expect(isPlayableCut([])).toBe(false);
  });
});

describe("parseSpeed / parseDrops", () => {
  it("only allows 1, 1.25, 1.5, 2", () => {
    expect(parseSpeed(1.5)).toBe(1.5);
    expect(parseSpeed(3)).toBe(1);
    expect(parseSpeed("nope")).toBe(1);
  });

  it("speeds video by shrinking PTS, not by raising fps", () => {
    expect(speedVideoFilter(2)).toBe("setpts=(PTS-STARTPTS)/2");
    expect(speedVideoFilter(1.25)).toBe("setpts=(PTS-STARTPTS)/1.25");
    expect(speedVideoFilter(2)).not.toContain("fps");
    expect(speedAudioFilter(2)).toBe("atempo=2");
  });

  it("drops junk ranges", () => {
    expect(parseDrops([{ start: 2, end: 4 }, { start: 5, end: 5.05 }, "x"])).toEqual([{ start: 2, end: 4 }]);
  });
});

describe("cutVideo", () => {
  it(
    "drops a middle section and speeds what is left",
    async () => {
      const dir = await mkdtemp(path.join(os.tmpdir(), "studio-cut-"));
      const clip = path.join(dir, "source.mp4");
      await runFfmpeg([
        "-f",
        "lavfi",
        "-i",
        "color=c=blue:s=320x240:d=2",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=440:duration=2",
        "-pix_fmt",
        "yuv420p",
        clip,
      ]);
      const outputRel = `generated/cut-test-${Date.now()}.mp4`;
      await cutVideo({
        sourceAbs: clip,
        outputRel,
        ranges: keepRanges({ start: 0, end: 2 }, [{ start: 0.6, end: 1.4 }]),
        speed: 2,
      });
      const { localRoot } = await import("@/lib/files");
      const duration = await clipDuration(path.join(localRoot(), outputRel));
      expect(duration).toBeGreaterThan(0.4);
      expect(duration).toBeLessThan(0.85);
      await rm(path.join(localRoot(), outputRel), { force: true });
      await rm(dir, { recursive: true, force: true });
    },
    20_000,
  );

  it(
    "makes 2× shorter than 1.25×",
    async () => {
      const dir = await mkdtemp(path.join(os.tmpdir(), "studio-speed-"));
      const clip = path.join(dir, "source.mp4");
      await runFfmpeg([
        "-f",
        "lavfi",
        "-i",
        "color=c=green:s=320x240:d=2:r=60",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=440:duration=2",
        "-pix_fmt",
        "yuv420p",
        clip,
      ]);
      const { localRoot } = await import("@/lib/files");
      const fastRel = `generated/speed-2-${Date.now()}.mp4`;
      const slowRel = `generated/speed-125-${Date.now()}.mp4`;
      const ranges = keepRanges({ start: 0, end: 2 }, []);
      await cutVideo({ sourceAbs: clip, outputRel: fastRel, ranges, speed: 2 });
      await cutVideo({ sourceAbs: clip, outputRel: slowRel, ranges, speed: 1.25 });
      const fastAbs = path.join(localRoot(), fastRel);
      const slowAbs = path.join(localRoot(), slowRel);
      const fast = await clipDuration(fastAbs);
      const slow = await clipDuration(slowAbs);
      const fastVideo = await streamDuration(fastAbs, "v:0");
      const fastAudio = await streamDuration(fastAbs, "a:0");
      const slowVideo = await streamDuration(slowAbs, "v:0");
      const slowAudio = await streamDuration(slowAbs, "a:0");
      expect(fast).toBeGreaterThan(0.9);
      expect(fast).toBeLessThan(1.15);
      expect(slow).toBeGreaterThan(1.5);
      expect(slow).toBeLessThan(1.75);
      expect(fast).toBeLessThan(slow - 0.4);
      expect(Math.abs(fastVideo - fastAudio)).toBeLessThan(0.1);
      expect(Math.abs(slowVideo - slowAudio)).toBeLessThan(0.1);
      await rm(fastAbs, { force: true });
      await rm(slowAbs, { force: true });
      await rm(dir, { recursive: true, force: true });
    },
    20_000,
  );
});
