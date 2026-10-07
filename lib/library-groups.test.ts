import { describe, expect, it } from "vitest";
import { folderCount, groupByDeal, groupLibrary, libraryAction, libraryMark } from "@/lib/library-groups";

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
    expect(groups.map((group) => group.deal)).toEqual(["Brand A", "Brand B", "Personal"]);
    expect(groups[0].items).toHaveLength(1);
  });
});

describe("groupLibrary", () => {
  const card = (status: string, deal: string | null) => ({
    status,
    campaign: deal ? { name: deal } : null,
  });

  it("keeps a batch together and splits posted videos out", () => {
    const folders = groupLibrary([
      { id: "a", batch: "Sitescout", card: card("READY", "Sitescout") },
      { id: "b", batch: "Sitescout", card: card("POSTED", "Sitescout") },
      { id: "c", batch: "", card: card("READY", "Polsia") },
    ]);
    expect(folders.map((folder) => folder.title)).toEqual(["Sitescout", "Polsia"]);
    expect(folders[0].still).toHaveLength(1);
    expect(folders[0].posted).toHaveLength(1);
    expect(folderCount(12, 3)).toBe("12 still to do · 3 posted");
    expect(folderCount(0, 4)).toBe("4 posted");
  });
});
