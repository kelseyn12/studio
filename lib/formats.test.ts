import { describe, expect, it } from "vitest";
import { nextLanes } from "@/lib/formats";

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
