import { describe, expect, it } from "vitest";
import { dealAccounts, describeTargets, networkShort, targetAccounts } from "@/lib/targets";

const accounts = [
  { id: "polsia-ig", network: "instagram", username: "polsia", isActive: true, campaignId: "polsia" },
  { id: "polsia-fb", network: "facebook", username: "polsia", isActive: true, campaignId: "polsia" },
  { id: "morphi-tt", network: "tiktok", username: "morphi", isActive: true, campaignId: "morphi" },
  { id: "morphi-yt-old", network: "youtube", username: "morphi", isActive: false, campaignId: "morphi" },
  { id: "me-ig", network: "instagram", username: "kelsey", isActive: true, campaignId: null },
];

describe("targetAccounts", () => {
  it("sends a deal video to every active account on that deal", () => {
    const ids = targetAccounts(accounts, { campaignId: "polsia", accountId: null }).map((account) => account.id);
    expect(ids).toEqual(["polsia-ig", "polsia-fb"]);
  });

  it("skips inactive accounts", () => {
    const ids = targetAccounts(accounts, { campaignId: "morphi", accountId: null }).map((account) => account.id);
    expect(ids).toEqual(["morphi-tt"]);
  });

  it("ignores a picked account when the deal owns accounts", () => {
    const ids = targetAccounts(accounts, { campaignId: "polsia", accountId: null }, "me-ig").map((account) => account.id);
    expect(ids).toEqual(["polsia-ig", "polsia-fb"]);
  });

  it("falls back to the picked or saved account for personal videos", () => {
    expect(targetAccounts(accounts, { campaignId: null, accountId: "me-ig" }).map((account) => account.id)).toEqual([
      "me-ig",
    ]);
    expect(targetAccounts(accounts, { campaignId: null, accountId: null }, "me-ig").map((account) => account.id)).toEqual([
      "me-ig",
    ]);
    expect(targetAccounts(accounts, { campaignId: "sitescout", accountId: null })).toEqual([]);
  });

  it("describes targets short", () => {
    expect(describeTargets(dealAccounts(accounts, "polsia"))).toBe("IG @polsia · FB @polsia");
    expect(networkShort("TikTok")).toBe("TT");
    expect(networkShort("bluesky")).toBe("bluesky");
  });
});
