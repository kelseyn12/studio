import { describe, expect, it } from "vitest";
import { isValidCut, trimFromSilence, NO_TRIM } from "@/lib/ffmpeg";

const line = (start: number, end?: number) =>
  `[silencedetect @ 0x0] silence_start: ${start}\n` +
  (end !== undefined ? `[silencedetect @ 0x0] silence_end: ${end} | silence_duration: ${end - start}\n` : "");

describe("trimFromSilence", () => {
  it("keeps the clip untouched when there is no dead air", () => {
    expect(trimFromSilence("", 10)).toEqual(NO_TRIM);
  });

  it("cuts quiet lead-in at the start", () => {
    const trim = trimFromSilence(line(0, 1.2), 10);
    expect(trim.start).toBeCloseTo(1.15);
    expect(trim.end).toBeNull();
  });

  it("cuts a quiet tail that runs to the end of the clip", () => {
    const trim = trimFromSilence(line(8.4), 10);
    expect(trim.start).toBe(0);
    expect(trim.end).toBeCloseTo(8.45);
  });

  it("cuts both ends in one pass", () => {
    const log = line(0, 0.9) + line(9.1, 10);
    const trim = trimFromSilence(log, 10);
    expect(trim.start).toBeCloseTo(0.85);
    expect(trim.end).toBeCloseTo(9.15);
  });

  it("ignores quiet moments in the middle of the clip", () => {
    const trim = trimFromSilence(line(4, 5), 10);
    expect(trim).toEqual(NO_TRIM);
  });

  it("refuses to trim a clip down to nothing", () => {
    const log = line(0, 4.9) + line(5.1, 10);
    expect(trimFromSilence(log, 10)).toEqual(NO_TRIM);
  });
});

describe("isValidCut", () => {
  it("accepts a real window and rejects junk", () => {
    expect(isValidCut(1.2, 8.4)).toBe(true);
    expect(isValidCut(0, 0.5)).toBe(true);
    expect(isValidCut(5, 5.2)).toBe(false);
    expect(isValidCut(-1, 4)).toBe(false);
    expect(isValidCut(Number.NaN, 4)).toBe(false);
  });
});
