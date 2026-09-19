import { describe, expect, it } from "vitest";
import { emptyCounts, pickNextAction } from "@/lib/next-action";

describe("pickNextAction", () => {
  it("asks for a deal when none are active", () => {
    expect(pickNextAction(emptyCounts()).kind).toBe("deal");
  });

  it("reviews before filming", () => {
    const action = pickNextAction({ ...emptyCounts(), activeDeals: 1, review: 3, filmed: 9 });
    expect(action.kind).toBe("review");
    expect(action.count).toBe(3);
  });

  it("plans when the board is clear", () => {
    expect(pickNextAction({ ...emptyCounts(), activeDeals: 2 }).kind).toBe("plan");
  });
});
