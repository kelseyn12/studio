import { describe, expect, it } from "vitest";
import { canMarkDelivered, deliveredLabel } from "@/lib/deliver";

describe("brand delivery", () => {
  it("allows a finished video that is still To schedule", () => {
    expect(canMarkDelivered("READY", null, true)).toBe(true);
  });

  it("blocks a video that already has a day, is not ready, or has no file", () => {
    expect(canMarkDelivered("READY", new Date(), true)).toBe(false);
    expect(canMarkDelivered("REVIEW", null, true)).toBe(false);
    expect(canMarkDelivered("POSTED", null, true)).toBe(false);
    expect(canMarkDelivered("READY", null, false)).toBe(false);
  });

  it("labels a posted video with no app jobs as sent to the brand", () => {
    expect(deliveredLabel("POSTED", 0)).toBe("Sent to the brand");
    expect(deliveredLabel("POSTED", 2)).toBeNull();
    expect(deliveredLabel("READY", 0)).toBeNull();
    expect(deliveredLabel("DATA", 0)).toBeNull();
  });
});
