import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { runFfmpeg } from "@/lib/ffmpeg";
import { writeLogoSheet } from "@/lib/hook-logos";
import { alignLogoRow, boxesFromItems, CANVAS_H, defaultLogoPos, logoBoxes, parseLogoItems, parseLogos, snapLogoPos, stringifyLogos } from "@/lib/hook-logos-math";

describe("parseLogos", () => {
  it("keeps safe relative paths and caps at 4", () => {
    const raw = JSON.stringify([
      { path: "repurpose/a/logo.png", filename: "logo.png" },
      { path: "../etc/passwd", filename: "no" },
      { path: "/abs.png", filename: "no" },
      { path: "b.png", filename: "b.png" },
      { path: "c.png", filename: "c.png" },
      { path: "d.png", filename: "d.png" },
      { path: "e.png", filename: "e.png" },
    ]);
    expect(parseLogos(raw).map((logo) => logo.path)).toEqual(["repurpose/a/logo.png", "b.png", "c.png", "d.png"]);
    expect(stringifyLogos(parseLogos(raw)).startsWith("[")).toBe(true);
  });

  it("keeps + = emoji and short text next to logo files", () => {
    const items = parseLogoItems(
      JSON.stringify([
        { path: "repurpose/a/claude.png", filename: "claude.png" },
        { kind: "mark", id: "plus", text: "+" },
        { path: "repurpose/a/higgs.png", filename: "higgs.png" },
        { kind: "mark", id: "eq", text: "=" },
        { kind: "mark", id: "fire", text: "🔥" },
      ]),
    );
    expect(items.map((item) => ("text" in item && item.kind === "mark" ? item.text : "logo"))).toEqual([
      "logo",
      "+",
      "logo",
      "=",
      "🔥",
    ]);
    expect(boxesFromItems(items).some((box) => box.kind === "mark" && box.text === "+")).toBe(true);
  });

  it("scales a logo when you ask for bigger", () => {
    const normal = boxesFromItems([{ path: "a.png", filename: "a.png" }]);
    const big = boxesFromItems([{ path: "a.png", filename: "a.png", scale: 2 }]);
    expect(normal[0].kind).toBe("logo");
    expect(big[0].kind).toBe("logo");
    if (normal[0].kind === "logo" && big[0].kind === "logo") expect(big[0].w).toBe(normal[0].w * 2);
  });

  it("lines unused logos across the top, not the play button", () => {
    expect(defaultLogoPos(0, 3)).toEqual({ x: 0.16, y: 0.15 });
    expect(defaultLogoPos(2, 3).x).toBeCloseTo(0.84);
    const [box] = boxesFromItems([{ path: "a.png", filename: "a.png" }]);
    expect(box.kind).toBe("logo");
    if (box.kind === "logo") expect(box.y + box.h / 2).toBeCloseTo(CANVAS_H * 0.15);
  });

  it("evens a logo row and snaps a chip to a neighbor", () => {
    const row = alignLogoRow(3, 0.2);
    expect(row).toHaveLength(3);
    expect(row[0].y).toBe(0.2);
    expect(row[2].x - row[1].x).toBeCloseTo(row[1].x - row[0].x);
    expect(snapLogoPos(0.51, 0.21, [{ x: 0.5, y: 0.2 }])).toEqual({ x: 0.5, y: 0.2 });
  });
});

describe("logoBoxes", () => {
  it("centers one logo", () => {
    const [box] = logoBoxes(1);
    expect(box).toMatchObject({ kind: "logo", index: 0, w: 360, h: 360 });
    if (box.kind === "logo") expect(box.x + box.w / 2).toBe(540);
  });

  it("keeps three logos in a row unless equation is on", () => {
    expect(logoBoxes(3).every((box) => box.kind === "logo")).toBe(true);
    expect(logoBoxes(3)).toHaveLength(3);
    const kinds = logoBoxes(3, true).map((box) => (box.kind === "mark" ? box.text : "logo"));
    expect(kinds).toEqual(["logo", "+", "logo", "=", "logo"]);
  });
});

describe("writeLogoSheet", () => {
  it(
    "writes a 1080×1920 sheet from three squares",
    async () => {
      const dir = await mkdtemp(path.join(os.tmpdir(), "studio-logos-"));
      const files = await Promise.all(
        ["red", "green", "blue"].map(async (color, index) => {
          const file = path.join(dir, `${index}.png`);
          await runFfmpeg(["-f", "lavfi", "-i", `color=c=${color}:s=200x200:d=1`, "-frames:v", "1", file]);
          return file;
        }),
      );
      const rel = await writeLogoSheet(files);
      const { localRoot } = await import("@/lib/files");
      const { stat } = await import("fs/promises");
      expect((await stat(path.join(localRoot(), rel))).size).toBeGreaterThan(800);
      await rm(path.join(localRoot(), rel), { force: true });
      const mixed = await writeLogoSheet(files.slice(0, 2), [], false, [
        { path: files[0], filename: "a.png" },
        { kind: "mark", id: "plus", text: "+" },
        { path: files[1], filename: "b.png" },
        { kind: "mark", id: "eq", text: "=" },
        { kind: "mark", id: "fire", text: "100+" },
      ]);
      expect((await stat(path.join(localRoot(), mixed))).size).toBeGreaterThan(800);
      await rm(path.join(localRoot(), mixed), { force: true });
      await rm(dir, { recursive: true, force: true });
    },
    20_000,
  );
});
