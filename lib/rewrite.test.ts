import { describe, expect, it } from "vitest";
import { parseRewrite, rewritePrompt } from "@/lib/rewrite";
import { parseAnalytics } from "@/lib/analytics";

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
});
