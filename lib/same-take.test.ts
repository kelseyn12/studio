import { describe, expect, it } from "vitest";
import { bodyCtaClash, sameTake } from "@/lib/same-take";

describe("same take", () => {
  it("matches only identical voice prints", () => {
    expect(sameTake("abc123456", "abc123456")).toBe(true);
    expect(sameTake("abc123456", "zzz123456")).toBe(false);
    expect(sameTake("", "abc123456")).toBe(false);
  });

  it("flags a body that is also sitting in CTAs", async () => {
    const print = async (file: string) => (file.includes("ending") ? "same-voice-123" : `voice-${file}`);
    expect(
      await bodyCtaClash([{ path: "walk" }, { path: "ending" }], [{ path: "ask" }, { path: "ending" }], print),
    ).toBe(true);
    expect(await bodyCtaClash([{ path: "walk" }], [{ path: "ask" }], print)).toBe(false);
  });
});
