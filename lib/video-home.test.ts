import { describe, expect, it } from "vitest";
import { homeLabel, isBrandHome, placeFromForm } from "@/lib/video-home";

describe("video home", () => {
  it("keeps a deal name ahead of the folder", () => {
    expect(homeLabel("trybe", "Polsia")).toBe("Polsia");
  });

  it("uses Trybe, Brand work, and Personal when there is no deal", () => {
    expect(homeLabel("trybe", null)).toBe("Trybe");
    expect(homeLabel("brand", "")).toBe("Brand work");
    expect(homeLabel("personal", null)).toBe("Personal");
    expect(homeLabel(null, null)).toBe("Personal");
  });

  it("treats only Brand work and Trybe as brand folders", () => {
    expect(isBrandHome("trybe", null)).toBe(true);
    expect(isBrandHome("brand", null)).toBe(true);
    expect(isBrandHome("personal", null)).toBe(false);
    expect(isBrandHome("trybe", "Polsia")).toBe(false);
  });

  it("reads the place menu", () => {
    expect(placeFromForm("trybe")).toEqual({ home: "trybe", campaignId: null });
    expect(placeFromForm("brand")).toEqual({ home: "brand", campaignId: null });
    expect(placeFromForm("personal")).toEqual({ home: "personal", campaignId: null });
    expect(placeFromForm("deal-1")).toEqual({ home: "personal", campaignId: "deal-1" });
  });
});
