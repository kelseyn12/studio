import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { runFfmpeg, uniquenessFilter } from "@/lib/ffmpeg";
import { variationFor } from "@/lib/variations";

describe("uniquenessFilter", () => {
  it("writes speed, color, and crop into the ffmpeg chain", () => {
    const variation = variationFor(1, { speedAmt: 4, colorAmt: 10, cropAmt: 6 });
    const filter = uniquenessFilter(variation);
    expect(filter).toContain("setpts=");
    expect(filter).toContain("eq=saturation=");
    expect(filter).toContain("crop=1080:1920");
    expect(filter).toMatch(/scale=\d+:\d+/);
  });
});

describe("assemble uniqueness", () => {
  it(
    "renders two copies that are not the same file size",
    async () => {
      const dir = await mkdtemp(path.join(os.tmpdir(), "studio-clip-"));
      const clip = path.join(dir, "hook.mp4");
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
        clip,
      ]);
      const { assembleVideo } = await import("@/lib/ffmpeg");
      const first = variationFor(0, { speedAmt: 5, colorAmt: 12, cropAmt: 8 });
      const second = variationFor(1, { speedAmt: 5, colorAmt: 12, cropAmt: 8 });
      const a = await assembleVideo({
        clips: [{ path: clip }],
        outputName: `test-a-${Date.now()}.mp4`,
        ...omitLabel(first),
      });
      const b = await assembleVideo({
        clips: [{ path: clip }],
        outputName: `test-b-${Date.now()}.mp4`,
        ...omitLabel(second),
      });
      const { stat } = await import("fs/promises");
      const { absoluteUpload } = await import("@/lib/files");
      const sizeA = (await stat(absoluteUpload(a))).size;
      const sizeB = (await stat(absoluteUpload(b))).size;
      expect(sizeA).toBeGreaterThan(1000);
      expect(sizeB).toBeGreaterThan(1000);
      expect(sizeA).not.toBe(sizeB);
      await rm(absoluteUpload(a), { force: true });
      await rm(absoluteUpload(b), { force: true });
      await rm(dir, { recursive: true, force: true });
    },
    30_000,
  );
});

function omitLabel(variation: ReturnType<typeof variationFor>) {
  const { label: _label, ...filters } = variation;
  return filters;
}
