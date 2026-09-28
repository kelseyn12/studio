import { describe, expect, it } from "vitest";
import {
  bonusEarnedCents,
  bonusesFromForm,
  parseBonuses,
  perVideoCents,
  serializeBonuses,
  videoMoneyCents,
} from "@/lib/deal-bonuses";
import { scoreDeal } from "@/lib/deals";

const polsia = [
  { views: 100_000, payoutCents: 25_000 },
  { views: 1_000_000, payoutCents: 100_000 },
];

describe("view bonuses", () => {
  it("pays every bonus a video has crossed, once each", () => {
    expect(bonusEarnedCents(0, polsia)).toBe(0);
    expect(bonusEarnedCents(99_999, polsia)).toBe(0);
    expect(bonusEarnedCents(100_000, polsia)).toBe(25_000);
    expect(bonusEarnedCents(2_000_000, polsia)).toBe(125_000);
  });

  it("round-trips through the stored JSON, sorted and cleaned", () => {
    const raw = serializeBonuses([{ views: 1_000_000, payoutCents: 100_000 }, { views: 100_000, payoutCents: 25_000 }, { views: 0, payoutCents: 5 }]);
    expect(parseBonuses(raw)).toEqual(polsia);
    expect(serializeBonuses([])).toBe("");
    expect(parseBonuses("")).toEqual([]);
    expect(parseBonuses("not json")).toEqual([]);
  });

  it("reads repeated form rows in dollars", () => {
    const form = new FormData();
    form.append("bonusPay", "250");
    form.append("bonusViews", "100000");
    form.append("bonusPay", "");
    form.append("bonusViews", "");
    form.append("bonusPay", "1000");
    form.append("bonusViews", "1000000");
    expect(bonusesFromForm(form)).toEqual(polsia);
  });

  it("adds base, CPM and bonuses into one number per video", () => {
    const deal = { cpmCents: 100, bonusesJson: serializeBonuses(polsia) };
    expect(videoMoneyCents({ payoutCents: 1_167, views: 0 }, deal)).toBe(1_167);
    // 150k views: $11.67 base + $150 CPM + $250 bonus
    expect(videoMoneyCents({ payoutCents: 1_167, views: 150_000 }, deal)).toBe(1_167 + 15_000 + 25_000);
    expect(videoMoneyCents({ payoutCents: 1_167, views: 150_000 }, null)).toBe(1_167);
  });
});

describe("flat monthly pay", () => {
  it("spreads the month over the videos owed", () => {
    expect(perVideoCents(70_000, 60)).toBe(1_167);
    expect(perVideoCents(0, 60)).toBe(0);
    expect(perVideoCents(70_000, 0)).toBe(70_000);
  });

  it("scores the month as the flat fee instead of pay × slots", () => {
    const score = scoreDeal({
      basePayCents: 1_167,
      monthlyPayCents: 70_000,
      postsPerDay: 2,
      accountsAllowed: 1,
      minutesPerPost: 10,
      monthlyHoursEstimate: 15,
      minViews: 0,
      approvalFriction: "LOW",
      approvalHours: 24,
      creativeFreedom: 3,
      managerResponsive: true,
      othersViral: false,
      briefSupply: false,
      editorIncluded: false,
      cpmCents: 0,
    });
    expect(score.monthlyPayoutCents).toBe(70_000);
  });
});
