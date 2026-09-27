import { mkdtemp, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";
import {
  assClock,
  assColor,
  buildHookAss,
  escapeAssText,
  escapeFilterPath,
  parseHighlight,
  stripHighlight,
  writeHookAss,
} from "@/lib/ass";
import { runFfmpeg } from "@/lib/ffmpeg";
import { listStack } from "@/lib/list-layout";

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

describe("assClock", () => {
  it("writes libass timestamps", () => {
    expect(assClock(0)).toBe("0:00:00.00");
    expect(assClock(1.25)).toBe("0:00:01.25");
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
    expect(buildHookAss({ text: "Hello", style: "tiktok", x: 0.5, y: 0.3 })).toContain("\\pos(");
    expect(track).toContain("1.");
    expect(track).toContain("5.");
    expect(
      buildHookAss({ text: "x", style: "plain", listItems: ["Nobody talks about this", "Your month"], font: "Arial" }),
    ).toContain("1.");
    expect(
      buildHookAss({ text: "x", style: "plain", listItems: ["Nobody talks about this", "Your month"], font: "Arial" }),
    ).not.toContain("1. Nobody talks about this");
    expect(track).toContain("Style: Head,Arial,82");
  });

  it("gives Instagram Reels Classic and TikTok Classic their own stroke", () => {
    const instagram = buildHookAss({ text: "hello there", style: "instagram", font: "Arial" });
    const tiktok = buildHookAss({ text: "hello there", style: "tiktok", font: "Arial" });
    expect(instagram).toMatch(/Style: Head,Arial,76,.*,1,5,1,8,/);
    expect(tiktok).toMatch(/Style: Head,Arial,82,.*,1,5,2,8,/);
    expect(buildHookAss({ text: "hello there", style: "instagram", box: true, font: "Arial" })).toMatch(
      /Style: Head,Arial,76,.*,3,16,0,8,/,
    );
    expect(buildHookAss({ text: "x", style: "plain", font: "Arial" }).match(/,List,/g)).toBeNull();
  });

  it("wraps long lines and keeps the starred word colored after wrapping", () => {
    const track = buildHookAss({ text: "Nobody talks about this one *weird* trick", style: "plain", font: "Arial" });
    expect(track).toContain("\\N");
    expect(track).toContain("{\\c&H5CFF5C&}weird");
  });

  it("keeps empty numbers up, then fills a line at its clock", () => {
    const track = buildHookAss({
      text: "x",
      style: "plain",
      listItems: ["January", "July"],
      listAt: [2, 5],
      font: "Arial",
    });
    expect(track).toContain("0:00:00.00,0:00:02.00,List,");
    expect(track).toContain("1. January");
    expect(track.match(/,List,/g)).toHaveLength(4);
  });

  it("puts body words on the hook number rows", () => {
    const hook = buildHookAss({ text: "Hello there", style: "tiktok", listCount: 3, x: 0.5, y: 0.2, font: "Arial" });
    const body = buildHookAss({
      text: "",
      style: "tiktok",
      listItems: ["One", "Two"],
      listAt: [1, 2],
      listStack: listStack({ style: "tiktok", headline: "Hello there", x: 0.5, y: 0.2, count: 3 }),
      listCount: 3,
      font: "Arial",
    });
    const hookY = hook.match(/\\pos\(90,(\d+)\)\}1\./)?.[1];
    const bodyY = body.match(/\\pos\(90,(\d+)\)\}1\./)?.[1];
    expect(hookY).toBeTruthy();
    expect(bodyY).toBe(hookY);
  });

  it("burns a body list with no headline", () => {
    const track = buildHookAss({ text: "", style: "instagram", listItems: ["Your month"], listAt: [3], font: "Arial" });
    expect(track).not.toMatch(/Dialogue:.*,Head,/);
    expect(track).toContain("1.");
    expect(track).toContain("1. Your month");
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
    "puts a green word in the headline and numbers down the left",
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
        filter,
        "-frames:v",
        "1",
        frame,
      ]);
      expect(await countPixels(frame, "1080:200:0:300", isGreen)).toBeGreaterThan(100);
      expect(await countPixels(frame, "1080:200:0:1500", isGreen)).toBe(0);
      expect(await countPixels(frame, "120:600:70:520", isWhite)).toBeGreaterThan(50);
      expect(await countPixels(frame, "120:600:500:520", isWhite)).toBe(0);
    },
    60_000,
  );
});
