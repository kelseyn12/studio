import { cpmEarnedCents } from "@/lib/deals";

/**
 * View bonuses on a deal: "$250 when a video hits 100k, $1k at 1M". Each posted video
 * earns every bonus its views have crossed. Stored on Campaign.bonusesJson so deals with
 * plain CPM or a flat fee carry nothing extra.
 */
export type ViewBonus = { views: number; payoutCents: number };

export const MAX_BONUSES = 6;

export function parseBonuses(raw: string | null | undefined): ViewBonus[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return cleanBonuses(
      parsed.map((row) => ({
        views: Number((row as ViewBonus)?.views),
        payoutCents: Number((row as ViewBonus)?.payoutCents),
      })),
    );
  } catch {
    return [];
  }
}

/** Drops empty rows, sorts by threshold, caps the list. */
export function cleanBonuses(rows: ViewBonus[]): ViewBonus[] {
  return rows
    .filter((row) => Number.isFinite(row.views) && Number.isFinite(row.payoutCents) && row.views > 0 && row.payoutCents > 0)
    .map((row) => ({ views: Math.round(row.views), payoutCents: Math.round(row.payoutCents) }))
    .sort((a, b) => a.views - b.views)
    .slice(0, MAX_BONUSES);
}

export function serializeBonuses(rows: ViewBonus[]): string {
  const clean = cleanBonuses(rows);
  return clean.length ? JSON.stringify(clean) : "";
}

/** Form rows come as repeated bonusViews / bonusPay ($) fields. */
export function bonusesFromForm(formData: FormData): ViewBonus[] {
  const views = formData.getAll("bonusViews").map((value) => Number(value));
  const pay = formData.getAll("bonusPay").map((value) => Math.round(Number(value) * 100));
  return cleanBonuses(views.map((threshold, index) => ({ views: threshold, payoutCents: pay[index] ?? 0 })));
}

/** Every bonus this many views has crossed, added up. */
export function bonusEarnedCents(views: number, bonuses: ViewBonus[]): number {
  if (views <= 0) return 0;
  return bonuses.filter((bonus) => views >= bonus.views).reduce((sum, bonus) => sum + bonus.payoutCents, 0);
}

export type DealMoney = { cpmCents: number; bonusesJson: string };

/** What one posted video is worth: its stamped pay, plus CPM on views, plus any bonuses crossed. */
export function videoMoneyCents(
  card: { payoutCents: number; views: number },
  deal: DealMoney | null | undefined,
): number {
  if (!deal) return card.payoutCents;
  return card.payoutCents + cpmEarnedCents(card.views, deal.cpmCents) + bonusEarnedCents(card.views, parseBonuses(deal.bonusesJson));
}

/** A flat monthly fee spread over the videos owed; that is the pay stamped on each video. */
export function perVideoCents(monthlyPayCents: number, videoCount: number): number {
  if (monthlyPayCents <= 0) return 0;
  return Math.round(monthlyPayCents / Math.max(videoCount, 1));
}

export function formatViews(views: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(views);
}
