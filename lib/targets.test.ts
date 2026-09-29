import { describe, expect, it } from "vitest";
import {
  accountsForLook,
  dealAccounts,
  describeTargets,
  handle,
  LOOK_APPS,
  networkShort,
  parseAccountIds,
  targetAccounts,
  targetApps,
} from "@/lib/targets";

const accounts = [
  { id: "polsia-ig", network: "instagram", username: "polsia", isActive: true, campaignId: "polsia" },
  { id: "polsia-fb", network: "facebook", username: "polsia", isActive: true, campaignId: "polsia" },
  { id: "morphi-tt", network: "tiktok", username: "morphi", isActive: true, campaignId: "morphi" },
  { id: "morphi-yt-old", network: "youtube", username: "morphi", isActive: false, campaignId: "morphi" },
  { id: "me-ig", network: "instagram", username: "kelsey", isActive: true, campaignId: null },
];

describe("handle", () => {
  it("shows one @ even when YouTube synced the username with its own", () => {
    expect(handle("polsia")).toBe("@polsia");
    expect(handle("@kelseynocekugc")).toBe("@kelseynocekugc");
    expect(describeTargets([{ network: "youtube", username: "@kelso" }])).toBe("YT @kelso");
  });
});

describe("targetAccounts", () => {
  it("sends a deal video to every active account on that deal", () => {
    const ids = targetAccounts(accounts, { campaignId: "polsia", accountId: null }).map((account) => account.id);
    expect(ids).toEqual(["polsia-ig", "polsia-fb"]);
  });

  it("skips inactive accounts", () => {
    const ids = targetAccounts(accounts, { campaignId: "morphi", accountId: null }).map((account) => account.id);
    expect(ids).toEqual(["morphi-tt"]);
  });

  it("uses the checked accounts so you can add the other look pair on a deal", () => {
    const ids = targetAccounts(accounts, { campaignId: "polsia", accountId: null }, ["polsia-ig", "me-ig"]).map(
      (account) => account.id,
    );
    expect(ids).toEqual(["polsia-ig", "me-ig"]);
  });

  it("falls back to every deal account when nothing is checked", () => {
    expect(targetAccounts(accounts, { campaignId: "polsia", accountId: null }).map((account) => account.id)).toEqual([
      "polsia-ig",
      "polsia-fb",
    ]);
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

  it("posts to every checked account when the deal has none assigned yet", () => {
    const ids = targetAccounts(accounts, { campaignId: null, accountId: null, accountIds: "me-ig,polsia-ig" }).map(
      (account) => account.id,
    );
    expect(ids).toEqual(["polsia-ig", "me-ig"]);
    expect(parseAccountIds("a, b a")).toEqual(["a", "b"]);
  });

  it("keeps saved Mix / Live checks even when the deal also has accounts", () => {
    const ids = targetAccounts(accounts, { campaignId: "polsia", accountId: null, accountIds: "me-ig,polsia-ig" }).map(
      (account) => account.id,
    );
    expect(ids).toEqual(["polsia-ig", "me-ig"]);
  });

  it("names the apps on each mix", () => {
    expect(LOOK_APPS.instagram).toEqual(["IG", "FB"]);
    expect(LOOK_APPS.tiktok).toEqual(["TT", "YT"]);
  });

  it("lists just the apps a video posts to, once each", () => {
    expect(
      targetApps([
        { network: "instagram" },
        { network: "facebook" },
        { network: "instagram" },
        { network: "youtube" },
      ]),
    ).toBe("IG · FB · YT");
    expect(targetApps([])).toBe("");
  });

  it("describes targets short", () => {
    expect(describeTargets(dealAccounts(accounts, "polsia"))).toBe("IG @polsia · FB @polsia");
    expect(networkShort("TikTok")).toBe("TT");
    expect(networkShort("bluesky")).toBe("bluesky");
  });
});

describe("accountsForLook", () => {
  it("keeps IG with Facebook and TikTok with YouTube", () => {
    const mix = [
      { network: "instagram", isActive: true },
      { network: "facebook", isActive: true },
      { network: "tiktok", isActive: true },
      { network: "youtube", isActive: true },
    ];
    expect(accountsForLook(mix, "instagram").map((account) => account.network)).toEqual(["instagram", "facebook"]);
    expect(accountsForLook(mix, "tiktok").map((account) => account.network)).toEqual(["tiktok", "youtube"]);
  });
});

describe("targetsByLook", () => {
  it("splits a cross-posting deal into one group per app look", async () => {
    const { targetsByLook } = await import("@/lib/targets");
    const morphi = [
      { network: "instagram", id: "ig" },
      { network: "tiktok", id: "tt" },
      { network: "youtube", id: "yt" },
      { network: "facebook", id: "fb" },
    ];
    const groups = targetsByLook(morphi).map((group) => ({ look: group.look, ids: group.accounts.map((a) => a.id) }));
    expect(groups).toEqual([
      { look: "instagram", ids: ["ig", "fb"] },
      { look: "tiktok", ids: ["tt", "yt"] },
    ]);
    expect(targetsByLook([{ network: "instagram", id: "ig" }])).toHaveLength(1);
  });
});
