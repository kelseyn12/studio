import { describe, expect, it } from "vitest";
import { buildHookAss } from "@/lib/ass";
import { lookEm } from "@/lib/ass-plate";
import { measureTextPx } from "@/lib/font-measure";
import { HOOK_LINE_CLASS } from "@/lib/hook-fonts";
import { hookFontFile } from "@/lib/hook-font-files";
import { wrapHookToWidth } from "@/lib/hook-emoji";
import { logoAvoidBoxes } from "@/lib/hook-layout";
import { FRAME_H, HOOK_LINE_MAX_PX, HOOK_LINE_W, keepClear, SAFE_ZONE } from "@/lib/list-layout";

const logoRow = [
  { x: 0.29, y: 0.15, halfW: 250 / 2 / 1080, halfH: 250 / 2 / 1920 },
  { x: 0.71, y: 0.15, halfW: 250 / 2 / 1080, halfH: 250 / 2 / 1920 },
];

describe("words keep clear of the logo row", () => {
  it("leaves a box alone when it does not touch a logo", () => {
    expect(keepClear({ x: 0.5, y: 0.5 }, 0.3, 0.02, logoRow)).toEqual({ x: 0.5, y: 0.5 });
    // Between the two logos, narrower than the gap: no hit.
    expect(keepClear({ x: 0.5, y: 0.15 }, 0.05, 0.02, logoRow)).toEqual({ x: 0.5, y: 0.15 });
  });

  it("pushes words below a logo they land on, with a small gap", () => {
    const halfH = 80 / FRAME_H;
    const at = keepClear({ x: 0.5, y: 0.22 }, 0.3, halfH, logoRow);
    expect(at.x).toBe(0.5);
    expect(at.y).toBeCloseTo(0.15 + 125 / 1920 + 12 / 1920 + halfH, 6);
    expect(at.y - halfH).toBeGreaterThan(0.15 + 125 / 1920);
  });

  it("pushes words above a logo when they sit higher than its middle, and stays in the zone", () => {
    const low = [{ x: 0.5, y: 0.6, halfW: 0.2, halfH: 0.06 }];
    const above = keepClear({ x: 0.5, y: 0.56 }, 0.3, 0.02, low);
    expect(above.y).toBeCloseTo(0.6 - 0.06 - 12 / 1920 - 0.02, 6);
    const pinned = keepClear({ x: 0.5, y: 0.14 }, 0.3, 0.02, [{ x: 0.5, y: 0.1, halfW: 0.4, halfH: 0.05 }]);
    expect(pinned.y).toBeGreaterThanOrEqual(SAFE_ZONE.top + 0.02);
  });

  it("turns the burned logo sheet into boxes in frame shares", () => {
    const boxes = logoAvoidBoxes([
      { path: "a/logo.png", filename: "logo.png", x: 0.7, y: 0.15, scale: 1.25 },
      { kind: "mark", id: "plus", text: "+", x: 0.5, y: 0.15 },
    ]);
    expect(boxes).toHaveLength(2);
    expect(boxes[0].x).toBeCloseTo(0.7, 2);
    expect(boxes[0].y).toBeCloseTo(0.15, 2);
    expect(boxes[0].halfH).toBeCloseTo(280 * 1.25 / 2 / 1920, 4);
    expect(boxes[1].halfW).toBeCloseTo(88 / 2 / 1080, 4);
  });

  it("burns the headline under the logos when its saved spot sits on them", () => {
    const avoid = logoAvoidBoxes([{ path: "a/logo.png", filename: "logo.png", x: 0.5, y: 0.15, scale: 1.25 }]);
    const clear = buildHookAss({ text: "BANGER", style: "instagram", x: 0.5, y: 0.2, avoid });
    const onTop = buildHookAss({ text: "BANGER", style: "instagram", x: 0.5, y: 0.2 });
    const yOf = (track: string) => Number(/Head,,0,0,0,,\{\\an5\\pos\(\d+,(\d+)\)/.exec(track)?.[1]);
    expect(yOf(onTop)).toBe(Math.round(0.2 * FRAME_H));
    expect(yOf(clear)).toBeGreaterThan(0.15 * FRAME_H + 175);
  });
});

describe("headline wraps at the safe-zone width", () => {
  it("ties the Words class to the burn width", () => {
    expect(HOOK_LINE_W).toBeCloseTo(0.8, 6);
    expect(HOOK_LINE_MAX_PX).toBe(864);
    expect(HOOK_LINE_CLASS).toContain("max-w-[80cqw]");
    expect(HOOK_LINE_CLASS).toContain("box-content");
  });

  it("breaks on measured width, not a character count", () => {
    const em = lookEm("tiktok", 82);
    const lines = wrapHookToWidth("THIS STARTED WITH ONE CLAUDE PROMPT", "tiktok", em, 82);
    expect(lines).toEqual(["THIS STARTED WITH ONE", "CLAUDE PROMPT"]);
    for (const line of lines) expect(measureTextPx(hookFontFile("tiktok"), line, em)).toBeLessThanOrEqual(HOOK_LINE_MAX_PX);
    expect(measureTextPx(hookFontFile("tiktok"), "THIS STARTED WITH ONE CLAUDE", em)).toBeGreaterThan(HOOK_LINE_MAX_PX);
    expect(wrapHookToWidth("BANGER 💥", "tiktok", em, 82)).toEqual(["BANGER 💥"]);
    expect(wrapHookToWidth("   ", "tiktok", em, 82)).toEqual([]);
    expect(wrapHookToWidth("a".repeat(120), "tiktok", em, 82).join("").length).toBeLessThanOrEqual(80);
  });
});
