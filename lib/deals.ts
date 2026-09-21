export type DealInput = {
  kind?: "TECH" | "UGC";
  videoCount?: number;
  basePayCents: number;
  postsPerDay: number;
  accountsAllowed: number;
  minutesPerPost: number;
  monthlyHoursEstimate: number;
  minViews: number;
  approvalFriction: "NONE" | "LOW" | "STRICT";
  approvalHours: number;
  creativeFreedom: number;
  managerResponsive: boolean;
  othersViral: boolean;
  briefSupply: boolean;
  editorIncluded: boolean;
  cpmCents: number;
};

export type DealScore = {
  monthlyPayoutCents: number;
  hourlyCents: number;
  economics: number;
  capacity: number;
  operations: number;
  total: number;
  verdict: "pass" | "shallow" | "skip";
  reasons: string[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function scoreUgc(deal: DealInput): DealScore {
  const videos = Math.max(deal.videoCount || 1, 1);
  const monthlyPayoutCents = deal.basePayCents;
  const hours = Math.max(deal.monthlyHoursEstimate, 1);
  const hourlyCents = Math.round(monthlyPayoutCents / hours);
  const perVideo = Math.round(monthlyPayoutCents / videos);
  const reasons: string[] = [];
  let economics = 20;
  if (perVideo >= 25000) economics += 20;
  else if (perVideo >= 15000) economics += 12;
  else reasons.push("Per-video fee is thin for traditional UGC.");
  if (monthlyPayoutCents >= 150000) economics += 10;
  if (hourlyCents >= 15000) economics += 10;
  let capacity = 20;
  if (videos >= 3 && videos <= 12) capacity += 15;
  else if (videos > 12) reasons.push("That many videos will stall without a batch plan.");
  let operations = 20;
  if (deal.approvalFriction === "NONE") operations += 15;
  else if (deal.approvalFriction === "LOW") operations += 8;
  else {
    operations -= 5;
    reasons.push("Strict brand approval will stall the cut.");
  }
  if (deal.managerResponsive) operations += 8;
  else reasons.push("Slow manager is a payout risk.");
  const total = clamp(Math.round(economics + capacity + operations), 0, 100);
  return {
    monthlyPayoutCents,
    hourlyCents,
    economics: clamp(economics, 0, 40),
    capacity: clamp(capacity, 0, 35),
    operations: clamp(operations, 0, 35),
    total,
    verdict: total >= 65 ? "pass" : total >= 45 ? "shallow" : "skip",
    reasons,
  };
}

export function scoreDeal(deal: DealInput): DealScore {
  if (deal.kind === "UGC") return scoreUgc(deal);
  const dailySlots = deal.postsPerDay * deal.accountsAllowed;
  const monthlyPayoutCents = deal.basePayCents * dailySlots * 30;
  const hours = Math.max(deal.monthlyHoursEstimate, 1);
  const hourlyCents = Math.round(monthlyPayoutCents / hours);
  const reasons: string[] = [];

  let economics = 20;
  if (deal.basePayCents >= 4000) economics += 15;
  else if (deal.basePayCents >= 2500) economics += 8;
  else reasons.push("Base pay is thin versus volume work.");
  if (deal.cpmCents > 0) economics += 8;
  if (hourlyCents >= 30000) economics += 20;
  else if (hourlyCents >= 15000) economics += 10;
  else reasons.push("Hourly rate is under $150. Time is the real cost.");

  let capacity = 10;
  if (dailySlots >= 8) capacity += 25;
  else if (dailySlots >= 4) capacity += 15;
  else {
    capacity += 4;
    reasons.push("Posting cap is too low to scale a 20k month.");
  }
  if (deal.accountsAllowed >= 2) capacity += 10;
  if (deal.minutesPerPost <= 10) capacity += 10;
  else if (deal.minutesPerPost >= 30) {
    capacity -= 8;
    reasons.push("Each post takes too long to film.");
  }

  let operations = 15;
  if (deal.approvalFriction === "NONE") operations += 20;
  else if (deal.approvalFriction === "LOW") operations += 10;
  else {
    operations -= 5;
    reasons.push("Strict approval will stall the pipeline.");
  }
  if (deal.approvalHours <= 12) operations += 8;
  if (deal.managerResponsive) operations += 8;
  else reasons.push("Slow manager is a payout and approval risk.");
  if (deal.briefSupply) operations += 6;
  if (deal.editorIncluded) operations += 4;
  if (deal.othersViral) operations += 10;
  else reasons.push("No proof other creators are going viral here.");
  if (deal.creativeFreedom >= 4) operations += 6;
  if (deal.minViews >= 50000) {
    operations -= 8;
    reasons.push("High view minimum makes the deal fragile.");
  }

  const total = clamp(Math.round(economics + capacity + operations), 0, 100);
  const verdict: DealScore["verdict"] =
    total >= 70 && dailySlots >= 4 ? "pass" : total >= 50 ? "shallow" : "skip";

  return {
    monthlyPayoutCents,
    hourlyCents,
    economics: clamp(economics, 0, 40),
    capacity: clamp(capacity, 0, 35),
    operations: clamp(operations, 0, 35),
    total,
    verdict,
    reasons,
  };
}

/** Views money: CPM is cents per 1,000 views on the deal. */
export function cpmEarnedCents(views: number, cpmCents: number): number {
  if (views <= 0 || cpmCents <= 0) return 0;
  return Math.round((views / 1000) * cpmCents);
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
