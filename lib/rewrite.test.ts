import { describe, expect, it } from "vitest";
import { parseRewrite, rewritePrompt } from "@/lib/rewrite";
import { parseAnalytics, closeLoop } from "@/lib/analytics";

describe("hook rewrite", () => {
  it("asks for a short spoken hook", () => {
    expect(rewritePrompt({ hook: "wait for it", premise: "the result", script: "" })).toContain("under 14 words");
  });

  it("reads chat completions text", () => {
    expect(parseRewrite({ choices: [{ message: { content: '"Stop filming in your room."' } }] })).toBe(
      "Stop filming in your room.",
    );
  });
});

describe("Outstand analytics", () => {
  it("reads nested view counts", () => {
    expect(parseAnalytics({ data: { views: 1200, likes: 40, comments: 3 } })).toEqual({
      views: 1200,
      likes: 40,
      comments: 3,
    });
  });

  it("closes Posted then Data once views exist", () => {
    const publishedAt = new Date("2026-09-21T00:00:00.000Z");
    expect(closeLoop({ publishedAt, views: 0 })?.status).toBe("POSTED");
    expect(closeLoop({ publishedAt, views: 80 })?.status).toBe("DATA");
    expect(closeLoop({ publishedAt: null, views: 80 })).toBeNull();
  });
});
