import { mkdtemp, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";
import {
  assColor,
  buildHookAss,
  escapeAssText,
  escapeFilterPath,
  parseHighlight,
  stripHighlight,
  writeHookAss,
} from "@/lib/ass";
import { runFfmpeg, tintFilter } from "@/lib/ffmpeg";

describe("highlight markup", () => {
  it("splits starred words out of a line", () => {
    expect(parseHighlight("*WORST* birthday months")).toEqual([
      { text: "WORST", accent: true },
      { text: " birthday months", accent: false },
    ]);
    expect(parseHighlight("no stars here")).toEqual([{ text: "no stars here", accent: false }]);
    expect(parseHighlight("the *easiest* and *best*")).toHaveLength(4);
    expect(stripHighlight("*WORST* birthday *months*")).toBe("WORST birthday months");
  });

  it("converts colors to libass byte order", () => {
    expect(assColor("#5CFF5C")).toBe("&H5CFF5C&");
    expect(assColor("#FF5C00")).toBe("&H005CFF&");
    expect(assColor("yellow")).toBe("&H00FFFF&");
    expect(assColor("white")).toBe("&HFFFFFF&");
  });

  it("keeps braces and colons from breaking the track or the filter", () => {
    expect(escapeAssText("a {b} c")).toBe("a (b) c");
    expect(escapeFilterPath("/tmp/x y:z.ass")).toBe("/tmp/x\\ y\\:z.ass");
  });
});

describe("buildHookAss", () => {
  it("colors only the starred word and stacks a numbered list under the headline", () => {
    const track = buildHookAss({
      text: "*WORST* birthday months",
      style: "tiktok",
      accentColor: "#5CFF5C",
      listCount: 5,
      font: "Arial",
    });
    expect(track).toContain("{\\c&H5CFF5C&}WORST{\\c&HFFFFFF&} birthday months");
    expect(track.match(/^Dialogue: .*,List,/gm)).toHaveLength(5);
    expect(track).toContain("1.");
    expect(track).toContain("5.");
    expect(track).toContain("Style: Head,Arial,72");
  });

  it("gives Instagram a box and TikTok an outline with shadow", () => {
    const instagram = buildHookAss({ text: "hello there", style: "instagram", font: "Arial" });
    const tiktok = buildHookAss({ text: "hello there", style: "tiktok", font: "Arial" });
    expect(instagram).toMatch(/Style: Head,Arial,66,.*,3,18,0,8,/);
    expect(tiktok).toMatch(/Style: Head,Arial,72,.*,1,5,3,8,/);
    expect(buildHookAss({ text: "x", style: "plain", font: "Arial" }).match(/,List,/g)).toBeNull();
  });

  it("wraps long lines and keeps the starred word colored after wrapping", () => {
    const track = buildHookAss({ text: "Nobody talks about this one *weird* trick", style: "plain", font: "Arial" });
    expect(track).toContain("\\N");
    expect(track).toContain("{\\c&H5CFF5C&}weird");
  });

  it("caps the list at ten", () => {
    const track = buildHookAss({ text: "x", style: "plain", listCount: 40, font: "Arial" });
    expect(track.match(/,List,/g)).toHaveLength(10);
  });
});

describe("Sasha frame renders with real ffmpeg", () => {
  let dir = "";
  afterAll(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  /** Average RGB over a region, via a tiny downscale to raw rgb24. */
  async function averageColor(frame: string, crop: string): Promise<[number, number, number]> {
    const raw = `${frame}.${crop.replace(/[^0-9]/g, "")}.rgb`;
    await runFfmpeg(["-i", frame, "-vf", `crop=${crop},scale=1:1:flags=area,format=rgb24`, "-f", "rawvideo", raw]);
    const bytes = await readFile(raw);
    return [bytes[0], bytes[1], bytes[2]];
  }

  const isGreen = (r: number, g: number, b: number) => g > r + 50 && g > b + 50;
  const isWhite = (r: number, g: number, b: number) => r > 200 && g > 200 && b > 200;

  async function countPixels(frame: string, crop: string, match: (r: number, g: number, b: number) => boolean) {
    const raw = `${frame}.${crop.replace(/[^0-9]/g, "")}.${match.name}`;
    await runFfmpeg(["-i", frame, "-vf", `crop=${crop},scale=iw/4:ih/4,format=rgb24`, "-f", "rawvideo", raw]);
    const bytes = await readFile(raw);
    let count = 0;
    for (let index = 0; index + 2 < bytes.length; index += 3) {
      if (match(bytes[index], bytes[index + 1], bytes[index + 2])) count += 1;
    }
    return count;
  }

  it(
    "puts a green word in the headline, numbers down the left and a red wash over the frame",
    async () => {
      dir = await mkdtemp(path.join(os.tmpdir(), "studio-ass-"));
      const frame = path.join(dir, "sasha.png");
      const filter = await writeHookAss({ text: "*WORST* birthday months", style: "tiktok", listCount: 5 });
      await runFfmpeg([
        "-f",
        "lavfi",
        "-i",
        "color=c=0x606060:s=1080x1920:d=0.2",
        "-vf",
        `${tintFilter(0)},${filter}`,
        "-frames:v",
        "1",
        frame,
      ]);
      // Untouched corner: the wash makes gray clearly red.
      const [r, g, b] = await averageColor(frame, "200:200:800:1600");
      expect(r).toBeGreaterThan(g + 40);
      expect(r).toBeGreaterThan(b + 40);
      // Headline band: the starred word leaves clearly green pixels; nothing else on the frame is green.
      expect(await countPixels(frame, "1080:200:0:300", isGreen)).toBeGreaterThan(100);
      expect(await countPixels(frame, "1080:200:0:1500", isGreen)).toBe(0);
      // List column carries white numbers; the same band to the right is bare wash.
      expect(await countPixels(frame, "120:600:70:520", isWhite)).toBeGreaterThan(50);
      expect(await countPixels(frame, "120:600:500:520", isWhite)).toBe(0);
    },
    60_000,
  );
});
