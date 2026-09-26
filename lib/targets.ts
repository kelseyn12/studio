/**
 * Where a video posts. A deal owns its accounts (Polsia → IG + FB, Morphi → IG + TT + YT + FB),
 * so a deal video ships to every active account on that deal in one Outstand post.
 * Personal videos (no deal, or a deal with no accounts yet) still use the single picked account.
 */
import { looksForNetworks, textStyleForNetwork, type DrawnStyle } from "@/lib/text-style";

export type TargetAccount = {
  id: string;
  outstandAccountId: string;
  network: string;
  username: string;
  nickname: string;
  isActive: boolean;
  campaignId: string | null;
};

export function dealAccounts<T extends { isActive: boolean; campaignId: string | null }>(
  accounts: T[],
  campaignId: string | null | undefined,
): T[] {
  if (!campaignId) return [];
  return accounts.filter((account) => account.isActive && account.campaignId === campaignId);
}

/** The accounts a video ships to: all of its deal's accounts, else the one picked. */
export function targetAccounts<T extends { id: string; isActive: boolean; campaignId: string | null }>(
  accounts: T[],
  card: { campaignId: string | null; accountId: string | null },
  pickedAccountId?: string | null,
): T[] {
  const fromDeal = dealAccounts(accounts, card.campaignId);
  if (fromDeal.length > 0) return fromDeal;
  const singleId = pickedAccountId || card.accountId;
  const single = accounts.find((account) => account.id === singleId);
  return single ? [single] : [];
}

/**
 * Split targets by the text look their app wants. A deal on IG + TT gives two groups, so the
 * Instagram-look file goes to IG/FB and the TikTok-look file goes to TT/YT.
 */
export function targetsByLook<T extends { network: string }>(targets: T[]): Array<{ look: DrawnStyle; accounts: T[] }> {
  return looksForNetworks(targets.map((target) => target.network)).map((look) => ({
    look,
    accounts: targets.filter((target) => textStyleForNetwork(target.network) === look),
  }));
}

/** "IG @polsia · FB @polsia" — short enough for a card footer. */
export function describeTargets(accounts: Array<{ network: string; username: string }>): string {
  return accounts.map((account) => `${networkShort(account.network)} @${account.username}`).join(" · ");
}

const NETWORK_SHORT: Record<string, string> = {
  instagram: "IG",
  tiktok: "TT",
  youtube: "YT",
  facebook: "FB",
  threads: "Threads",
  x: "X",
  linkedin: "LI",
};

export function networkShort(network: string): string {
  return NETWORK_SHORT[network.toLowerCase()] ?? network;
}
