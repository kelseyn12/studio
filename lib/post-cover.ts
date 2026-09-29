/**
 * Turns the cover frame saved on a finished video into what each app accepts through Outstand.
 * Instagram Reels take a JPEG URL (or a frame offset when no URL is reachable), YouTube takes a
 * JPEG URL (best-effort; Shorts often ignore it), TikTok takes only a frame timestamp and only
 * on DIRECT_POST. Facebook and Threads have no cover field, so they get nothing.
 */

export const MS_PER_SECOND = 1000;

export type CoverSource = { coverPath: string; coverAt: number };

/** Outstand publishes to the profile. Inbox drafts ignore the cover frame. */
export const TIKTOK_POST_MODE = "DIRECT_POST" as const;
export const TIKTOK_PRIVACY = "PUBLIC_TO_EVERYONE" as const;

export type TikTokOptions = {
  postMode: typeof TIKTOK_POST_MODE;
  privacyLevel: typeof TIKTOK_PRIVACY;
  videoCoverTimestampMs?: number;
};

export type NetworkOptions = {
  instagram?: { reelCoverUrl: string } | { reelThumbOffset: number };
  youtube?: { thumbnailUrl: string };
  tiktok?: TikTokOptions;
};

/** True when at least one target app can take a cover image URL, so it is worth uploading one. */
export function wantsCoverUrl(networks: string[]): boolean {
  return networks.some((network) => {
    const name = network.toLowerCase();
    return name === "instagram" || name === "youtube";
  });
}

export function coverMs(coverAt: number): number {
  return Math.max(0, Math.round(coverAt * MS_PER_SECOND));
}

/** New jpg each save so a second pick is not stuck behind the old cached file. */
export function nextCoverPath(assetId: string, now = Date.now()): string {
  return `thumbs/covers/${assetId}-${now}.jpg`;
}

/** Cover can change until the video has actually posted. */
export function coverCanChange(status: string): boolean {
  return status === "REVIEW" || status === "READY";
}

/**
 * Per-network Outstand options for a cover. `coverUrl` is a public JPEG URL of the frame, or ""
 * when none could be made — Instagram then falls back to the frame offset.
 */
export function coverOptions(networks: string[], cover: CoverSource, coverUrl: string): NetworkOptions {
  if (!cover.coverPath) return {};
  const names = new Set(networks.map((network) => network.toLowerCase()));
  const options: NetworkOptions = {};
  if (names.has("instagram")) {
    options.instagram = coverUrl ? { reelCoverUrl: coverUrl } : { reelThumbOffset: coverMs(cover.coverAt) };
  }
  if (names.has("youtube") && coverUrl) options.youtube = { thumbnailUrl: coverUrl };
  if (names.has("tiktok")) options.tiktok = tiktokBlock(coverMs(cover.coverAt));
  return options;
}

function tiktokBlock(coverAtMs?: number): TikTokOptions {
  return {
    postMode: TIKTOK_POST_MODE,
    privacyLevel: TIKTOK_PRIVACY,
    ...(coverAtMs !== undefined ? { videoCoverTimestampMs: coverAtMs } : {}),
  };
}

/** Cover fields plus TikTok auto-publish. TikTok still gets DIRECT_POST when no cover is saved. */
export function postOptions(networks: string[], cover: CoverSource, coverUrl: string): NetworkOptions {
  const options = coverOptions(networks, cover, coverUrl);
  if (networks.some((network) => network.toLowerCase() === "tiktok") && !options.tiktok) {
    options.tiktok = tiktokBlock();
  }
  return options;
}
