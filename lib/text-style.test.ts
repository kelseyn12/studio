import { mkdtemp, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";
import { escapeDrawText, HOOK_FONT, runFfmpeg } from "@/lib/ffmpeg";
import {
  hookTextFilters,
  parseTextStyle,
  resolveTextStyle,
  textStyleForNetwork,
  wrapHook,
  type DrawnStyle,
} from "@/lib/text-style";

describe("text style choice", () => {
  it("follows the account network when set to auto", () => {
    expect(textStyleForNetwork("tiktok")).toBe("tiktok");
    expect(textStyleForNetwork("TikTok")).toBe("tiktok");
    expect(textStyleForNetwork("instagram")).toBe("instagram");
    expect(textStyleForNetwork("facebook")).toBe("instagram");
    expect(textStyleForNetwork("youtube")).toBe("plain");
    expect(textStyleForNetwork(null)).toBe("plain");
    expect(resolveTextStyle("auto", "tiktok")).toBe("tiktok");
    expect(resolveTextStyle("instagram", "tiktok")).toBe("instagram");
  });

  it("falls back to auto for junk", () => {
    expect(parseTextStyle("tiktok")).toBe("tiktok");
    expect(parseTextStyle("neon")).toBe("auto");
    expect(parseTextStyle(null)).toBe("auto");
  });

  it("wraps hooks on word boundaries near 26 characters", () => {
    expect(wrapHook("I quit my 9-5 for this")).toEqual(["I quit my 9-5 for this"]);
    expect(wrapHook("Nobody talks about this one weird trick")).toEqual(["Nobody talks about this", "one weird trick"]);
    expect(wrapHook("   ")).toEqual([]);
    expect(wrapHook("a".repeat(120)).join("").length).toBeLessThanOrEqual(80);
  });

  it("draws one centered line per wrapped line, stacked downward", () => {
    const filters = hookTextFilters({
      escapedLines: ["ONE", "TWO"],
      style: "instagram",
      color: "yellow",
      fontfile: "/f.ttf",
    });
    expect(filters).toHaveLength(2);
    expect(filters[0]).toContain("box=1");
    expect(filters[0]).toContain("fontcolor=yellow");
    expect(filters[0]).toContain("y=h*0.16+0");
    expect(filters[1]).toContain("y=h*0.16+74");
    expect(hookTextFilters({ escapedLines: ["X"], style: "tiktok", color: "white", fontfile: "/f.ttf" })[0]).toContain(
      "shadowx=3",
    );
  });
});

describe("text styles render with real ffmpeg", () => {
  let dir = "";
  afterAll(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  async function brightRows(frame: string): Promise<{ top: number; bottom: number }> {
    // Downscale the frame to 1×192 so each output row is 10px of video; find where non-gray pixels are.
    const rowsFile = `${frame}.rows`;
    await runFfmpeg(["-i", frame, "-vf", "scale=1:192:flags=area,format=gray", "-f", "rawvideo", rowsFile]);
    const rows = await readFile(rowsFile);
    const touched: number[] = [];
    rows.forEach((value, row) => {
      if (Math.abs(value - 128) > 6) touched.push(row);
    });
    return { top: touched[0] ?? -1, bottom: touched[touched.length - 1] ?? -1 };
  }

  it.each<DrawnStyle>(["tiktok", "instagram", "plain"])(
    "%s style lands inside the safe zone",
    async (style) => {
      dir = dir || (await mkdtemp(path.join(os.tmpdir(), "studio-style-")));
      const frame = path.join(dir, `${style}.png`);
      const filters = hookTextFilters({
        escapedLines: wrapHook("Nobody talks about this one thing").map(escapeDrawText),
        style,
        color: "white",
        fontfile: HOOK_FONT,
      });
      await runFfmpeg([
        "-f",
        "lavfi",
        "-i",
        "color=c=gray:s=1080x1920:d=0.2",
        "-vf",
        filters.join(","),
        "-frames:v",
        "1",
        frame,
      ]);
      const { top, bottom } = await brightRows(frame);
      expect(top).toBeGreaterThanOrEqual(19); // clear of the 9–12% app header (row 19 ≈ 10%)
      expect(bottom).toBeLessThan(60); // well above the caption block (top ~31%)
      expect(bottom - top).toBeGreaterThanOrEqual(6); // two lines of text (60px+), not a stray pixel
    },
    60_000,
  );
});
