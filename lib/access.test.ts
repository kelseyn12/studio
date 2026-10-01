import { describe, expect, it } from "vitest";
import { canVisit, homeFor, isPublicPath } from "@/lib/access";

describe("access", () => {
  it("sends editors to Cuts", () => {
    expect(homeFor("EDITOR")).toBe("/edits");
    expect(canVisit("EDITOR", "/edits")).toBe(true);
    expect(canVisit("EDITOR", "/cards/abc")).toBe(true);
    expect(canVisit("EDITOR", "/cards/new")).toBe(false);
    expect(canVisit("EDITOR", "/campaigns")).toBe(false);
    expect(canVisit("EDITOR", "/calendar")).toBe(false);
    expect(canVisit("EDITOR", "/api/assets")).toBe(true);
    expect(canVisit("EDITOR", "/api/files/cards/a.mp4")).toBe(true);
  });

  it("lets a signed-out visitor open the privacy page", () => {
    expect(isPublicPath("/privacy")).toBe(true);
    expect(isPublicPath("/terms")).toBe(true);
    expect(isPublicPath("/analytics")).toBe(false);
  });

  it("lets creators into every room", () => {
    expect(canVisit("CREATOR", "/campaigns")).toBe(true);
    expect(homeFor("CREATOR")).toBe("/");
  });
});
