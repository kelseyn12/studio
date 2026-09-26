import { describe, expect, it } from "vitest";
import { cardsToPolish, polishNote } from "./batch-polish";

describe("cardsToPolish", () => {
  it("keeps only built, unscheduled videos", () => {
    const ids = cardsToPolish([
      { id: "ready", status: "READY", scheduledAt: null },
      { id: "scheduled", status: "READY", scheduledAt: new Date() },
      { id: "with-editor", status: "EDITING", scheduledAt: null },
      { id: "posted", status: "POSTED", scheduledAt: null },
    ]);
    expect(ids).toEqual(["ready"]);
  });

  it("returns nothing for an empty batch", () => {
    expect(cardsToPolish([])).toEqual([]);
  });
});

describe("polishNote", () => {
  it("tags the note with the batch name", () => {
    expect(polishNote("Week 3", "  tighten hooks ")).toBe("tighten hooks (Multiply batch: Week 3)");
  });

  it("falls back to a default when the note is blank", () => {
    expect(polishNote("Week 3", "   ")).toBe("Polish pass on Multiply batch: Week 3");
  });
});
