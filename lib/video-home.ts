export const VIDEO_HOMES = ["personal", "brand", "trybe"] as const;

export type VideoHome = (typeof VIDEO_HOMES)[number];

const LABELS: Record<VideoHome, string> = {
  personal: "Personal",
  brand: "Brand work",
  trybe: "Trybe",
};

export function isVideoHome(value: string): value is VideoHome {
  return (VIDEO_HOMES as readonly string[]).includes(value);
}

/** A named deal wins. Otherwise Personal, Brand work, or Trybe. */
export function homeLabel(home: string | null | undefined, campaignName?: string | null): string {
  const deal = campaignName?.trim();
  if (deal) return deal;
  if (home === "brand" || home === "trybe") return LABELS[home];
  return LABELS.personal;
}

/** Brand work and Trybe can leave the calendar without posting to her apps. */
export function isBrandHome(home: string | null | undefined, campaignName?: string | null): boolean {
  if (campaignName?.trim()) return false;
  return home === "brand" || home === "trybe";
}

/** The place menu. A deal id files the video on that deal. */
export function placeFromForm(value: string): { home: VideoHome; campaignId: string | null } {
  if (isVideoHome(value)) return { home: value, campaignId: null };
  if (!value) return { home: "personal", campaignId: null };
  return { home: "personal", campaignId: value };
}
