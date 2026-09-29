import { describe, expect, it } from "vitest";
import { groupByDeal, libraryAction, libraryMark } from "@/lib/library-groups";

describe("library marks", () => {
  const day = new Date("2026-09-29T20:00:00.000Z");

  it("says Scheduled once a finished video has a day", () => {
    expect(libraryMark("READY", day)).toBe("Scheduled");
    expect(libraryAction("READY", day)).toBe("Open");
  });

  it("keeps To schedule until a day is set", () => {
    expect(libraryMark("READY", null)).toBeUndefined();
    expect(libraryAction("READY", null)).toBe("Schedule");
  });
});

describe("groupByDeal", () => {
  it("piles finished videos under the deal name", () => {
    const groups = groupByDeal([
      { id: "2", card: { campaign: { name: "Brand B" } } },
      { id: "1", card: { campaign: { name: "Brand A" } } },
      { id: "3", card: { campaign: null } },
    ]);
    expect(groups.map((group) => group.deal)).toEqual(["Brand A", "Brand B", "No deal"]);
    expect(groups[0].items).toHaveLength(1);
  });
});
