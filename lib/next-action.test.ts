import { describe, expect, it } from "vitest";
import { emptyCounts, pickNextAction } from "@/lib/next-action";

describe("pickNextAction", () => {
  it("opens the multiplier when the board is empty", () => {
    expect(pickNextAction(emptyCounts()).kind).toBe("batch");
  });

  it("reviews before filming", () => {
    const action = pickNextAction({ ...emptyCounts(), activeDeals: 1, review: 3, filmed: 9 });
    expect(action.kind).toBe("review");
    expect(action.count).toBe(3);
    expect(action.detail).toMatch(/Needs changes/);
  });

  it("schedules ready inventory", () => {
    expect(pickNextAction({ ...emptyCounts(), ready: 4 }).kind).toBe("schedule");
  });

  it("opens the deal when nothing is on the board", () => {
    expect(pickNextAction({ ...emptyCounts(), activeDeals: 2, totalCards: 0 }).kind).toBe("deal");
  });

  it("sends VA jobs before self-cuts", () => {
    expect(pickNextAction({ ...emptyCounts(), filmed: 2, cutSelf: 5 }).kind).toBe("handoff");
    expect(pickNextAction({ ...emptyCounts(), cutSelf: 3 }).kind).toBe("cut");
  });
});
