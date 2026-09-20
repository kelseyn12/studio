import { describe, expect, it } from "vitest";
import { canVisit, homeFor } from "@/lib/access";

describe("access", () => {
  it("sends editors to CapCut in", () => {
    expect(homeFor("EDITOR")).toBe("/edits");
    expect(canVisit("EDITOR", "/edits")).toBe(true);
    expect(canVisit("EDITOR", "/cards/abc")).toBe(true);
    expect(canVisit("EDITOR", "/cards/new")).toBe(false);
    expect(canVisit("EDITOR", "/campaigns")).toBe(false);
    expect(canVisit("EDITOR", "/calendar")).toBe(false);
    expect(canVisit("EDITOR", "/api/assets")).toBe(true);
    expect(canVisit("EDITOR", "/api/files/cards/a.mp4")).toBe(true);
  });

  it("lets creators into every room", () => {
    expect(canVisit("CREATOR", "/campaigns")).toBe(true);
    expect(homeFor("CREATOR")).toBe("/");
  });
});
