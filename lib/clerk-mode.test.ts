import { describe, expect, it } from "vitest";
import { hasClerk, parseStudioRole } from "@/lib/clerk-mode";

describe("clerk mode", () => {
  it("is off without keys", () => {
    expect(hasClerk()).toBe(false);
  });

  it("only accepts studio roles", () => {
    expect(parseStudioRole("EDITOR")).toBe("EDITOR");
    expect(parseStudioRole("admin")).toBeNull();
  });
});
