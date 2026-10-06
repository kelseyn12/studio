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

/** Checkbox / form values → unique account ids. */
export function parseAccountIds(raw: string | string[] | null | undefined): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw || "").split(/[\s,]+/);
  return [...new Set(parts.map((part) => part.trim()).filter(Boolean))];
}

/** Active accounts that take this look. One video (plain) is every account. */
export function accountsForLook<T extends { network: string; isActive?: boolean }>(accounts: T[], look: string): T[] {
  return accounts.filter((account) => {
    if (account.isActive === false) return false;
    if (look === "plain") return true;
    return textStyleForNetwork(account.network) === look;
  });
}

/** Short app names on a mix card — IG + FB, or TT + YT. */
export const LOOK_APPS: Record<string, string[]> = {
  instagram: ["IG", "FB"],
  tiktok: ["TT", "YT"],
  plain: ["IG", "FB", "TT", "YT"],
};

/**
 * The accounts a video ships to. Checked ids on Mix / Live win, so an IG · FB file can go to
 * IG + FB and a TT · YT file can go to TT + YT even when the deal is missing one pair.
 * No checks → every account on the deal, else the ids saved on the card.
 */
export function targetAccounts<T extends { id: string; isActive: boolean; campaignId: string | null }>(
  accounts: T[],
  card: { campaignId: string | null; accountId: string | null; accountIds?: string | null },
  pickedAccountId?: string | string[] | null,
): T[] {
  const picked = parseAccountIds(pickedAccountId);
  const saved = parseAccountIds(card.accountIds);
  const ids = picked.length > 0 ? picked : saved.length > 0 ? saved : card.accountId ? [card.accountId] : [];
  if (ids.length > 0) {
    const wanted = new Set(ids);
    return accounts.filter((account) => account.isActive && wanted.has(account.id));
  }
  return dealAccounts(accounts, card.campaignId);
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

/** "IG · FB · YT" — just the apps this video posts to, one tag per app. */
export function targetApps(accounts: Array<{ network: string }>): string {
  const seen = new Set<string>();
  const apps: string[] = [];
  for (const account of accounts) {
    const short = networkShort(account.network);
    if (!seen.has(short)) {
      seen.add(short);
      apps.push(short);
    }
  }
  return apps.join(" · ");
}

/** "@polsia" — one @ even when the synced username already carries one (YouTube does). */
export function handle(username: string): string {
  return `@${username.replace(/^@+/, "")}`;
}

/** "IG @polsia · FB @polsia" — short enough for a card footer. */
export function describeTargets(accounts: Array<{ network: string; username: string }>): string {
  return accounts.map((account) => `${networkShort(account.network)} ${handle(account.username)}`).join(" · ");
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
