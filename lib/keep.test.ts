import { describe, expect, it } from "vitest";
import { batchClipsAreStale, isStalePosted, KEEP_FILE_DAYS, staleFinishedIds, supersededGeneratedIds } from "@/lib/keep";

const now = new Date("2026-09-26T12:00:00.000Z");
const old = new Date("2026-09-01T12:00:00.000Z");
const recent = new Date("2026-09-20T12:00:00.000Z");

describe("keep rules", () => {
  it(`treats posted videos as stale after ${KEEP_FILE_DAYS} days`, () => {
    expect(isStalePosted({ status: "POSTED", postedAt: old, updatedAt: old }, now)).toBe(true);
    expect(isStalePosted({ status: "DATA", postedAt: old, updatedAt: old }, now)).toBe(true);
    expect(isStalePosted({ status: "POSTED", postedAt: recent, updatedAt: recent }, now)).toBe(false);
    expect(isStalePosted({ status: "READY", postedAt: old, updatedAt: old }, now)).toBe(false);
  });

  it("drops generated looks once an editor cut exists", () => {
    expect(
      supersededGeneratedIds([
        { id: "ig", kind: "GENERATED" },
        { id: "tt", kind: "GENERATED" },
        { id: "cut", kind: "EDITED" },
      ]),
    ).toEqual(["ig", "tt"]);
    expect(supersededGeneratedIds([{ id: "ig", kind: "GENERATED" }])).toEqual([]);
  });

  it("drops finished files on stale posted videos only", () => {
    const files = [
      { id: "ig", kind: "GENERATED" },
      { id: "cut", kind: "EDITED" },
      { id: "voice", kind: "VOICE" },
    ];
    expect(staleFinishedIds({ status: "POSTED", postedAt: old, updatedAt: old }, files, now)).toEqual(["ig", "cut"]);
    expect(staleFinishedIds({ status: "READY", postedAt: null, updatedAt: old }, files, now)).toEqual([]);
  });

  it("clears batch clips only when every output has aged out", () => {
    const posted = { status: "POSTED", postedAt: old, updatedAt: old };
    const live = { status: "READY", postedAt: null, updatedAt: now };
    expect(batchClipsAreStale([{ card: posted }, { card: posted }], now)).toBe(true);
    expect(batchClipsAreStale([{ card: posted }, { card: live }], now)).toBe(false);
    expect(batchClipsAreStale([{ card: null }], now)).toBe(false);
    expect(batchClipsAreStale([], now)).toBe(false);
  });
});
