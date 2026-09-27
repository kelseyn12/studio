import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { runFfmpeg } from "@/lib/ffmpeg";
import { cutVideo } from "@/lib/cut";
import { isPlayableCut, keepRanges, parseDrops, parseSpeed } from "@/lib/cut-math";
import { clipDuration } from "@/lib/trim";

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
});
