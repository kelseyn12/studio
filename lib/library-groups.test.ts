import { describe, expect, it } from "vitest";
import { groupByDeal } from "@/lib/library-groups";

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
