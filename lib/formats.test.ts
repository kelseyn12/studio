import { describe, expect, it } from "vitest";
import { nextLanes, scoreFormats, WIN_VIEWS } from "@/lib/formats";

describe("nextLanes", () => {
  it("promotes the winner and demotes the old winner", () => {
    expect(
      nextLanes(
        [
          { id: "a", lane: "WINNER" },
          { id: "b", lane: "TEST" },
        ],
        "b",
      ),
    ).toEqual([
      { id: "a", lane: "CHALLENGER" },
      { id: "b", lane: "WINNER" },
    ]);
  });
});

describe("scoreFormats", () => {
  it("computes posts, win rate, average, and best", () => {
    const [row] = scoreFormats([
      { id: "a", name: "Green screen", lane: "WINNER", deal: "Brand", views: [WIN_VIEWS * 2, 500, WIN_VIEWS, 100] },
    ]);
    expect(row.posts).toBe(4);
    expect(row.wins).toBe(2);
    expect(row.winRate).toBe(50);
    expect(row.bestViews).toBe(WIN_VIEWS * 2);
    expect(row.avgViews).toBe(Math.round((WIN_VIEWS * 2 + 500 + WIN_VIEWS + 100) / 4));
  });

  it("puts the most-posted format first and handles empty formats", () => {
    const rows = scoreFormats([
      { id: "a", name: "New idea", lane: "TEST", deal: "Brand", views: [] },
      { id: "b", name: "Proven", lane: "WINNER", deal: "Brand", views: [100, 200, 300] },
    ]);
    expect(rows[0].id).toBe("b");
    expect(rows[1].posts).toBe(0);
    expect(rows[1].winRate).toBe(0);
    expect(rows[1].avgViews).toBe(0);
  });
});
