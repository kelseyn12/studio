import { describe, expect, it } from "vitest";
import { cpmEarnedCents, scoreDeal } from "@/lib/deals";

const deep = {
  basePayCents: 4000,
  postsPerDay: 8,
  accountsAllowed: 2,
  minutesPerPost: 8,
  monthlyHoursEstimate: 15,
  minViews: 0,
  approvalFriction: "NONE" as const,
  approvalHours: 0,
  creativeFreedom: 5,
  managerResponsive: true,
  othersViral: true,
  briefSupply: true,
  editorIncluded: true,
  cpmCents: 200,
};

describe("scoreDeal", () => {
  it("marks a high-volume easy deal as pass", () => {
    const score = scoreDeal(deep);
    expect(score.verdict).toBe("pass");
    expect(score.monthlyPayoutCents).toBe(4000 * 16 * 30);
    expect(score.hourlyCents).toBeGreaterThan(30000);
  });

  it("scores a traditional UGC retainer without demanding daily volume", () => {
    const score = scoreDeal({
      ...deep,
      kind: "UGC",
      basePayCents: 150000,
      videoCount: 3,
      monthlyHoursEstimate: 8,
      postsPerDay: 1,
      accountsAllowed: 1,
    });
    expect(score.verdict).toBe("pass");
    expect(score.monthlyPayoutCents).toBe(150000);
  });

  it("flags a high-pay low-volume deal as shallow or skip", () => {
    const score = scoreDeal({
      ...deep,
      postsPerDay: 1,
      accountsAllowed: 1,
      monthlyHoursEstimate: 60,
      approvalFriction: "STRICT",
      othersViral: false,
      minViews: 100000,
    });
    expect(score.verdict).not.toBe("pass");
    expect(score.reasons.length).toBeGreaterThan(0);
  });
});

describe("cpmEarnedCents", () => {
  it("pays per thousand views on top of base", () => {
    expect(cpmEarnedCents(250000, 100)).toBe(25000); // 250k views at $1 CPM = $250
    expect(cpmEarnedCents(0, 100)).toBe(0);
    expect(cpmEarnedCents(50000, 0)).toBe(0);
  });
});
