/**
 * Turns the cover frame saved on a finished video into what each app accepts through Outstand.
 * Instagram Reels take a JPEG URL (or a frame offset when no URL is reachable), YouTube takes a
 * 1280×720 JPEG, TikTok takes only a frame timestamp and only on DIRECT_POST. Facebook and Threads
 * have no cover field, so they get nothing.
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
  /** The chosen cover JPEG. TikTok uses it when the app accepts an image; the file also starts on that frame. */
  videoCoverImageUrl?: string;
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
    return name === "instagram" || name === "youtube" || name === "tiktok";
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
 * Per-network Outstand options for a cover. The shipped file starts on this frame, so a timestamp
 * of 0 is that picture. `coverUrl` is the 9:16 JPEG. `youtubeUrl` is the same frame at 1280×720.
 */
export function coverOptions(
  networks: string[],
  cover: CoverSource,
  coverUrl: string,
  youtubeUrl = coverUrl,
): NetworkOptions {
  if (!cover.coverPath) return {};
  const names = new Set(networks.map((network) => network.toLowerCase()));
  const options: NetworkOptions = {};
  if (names.has("instagram")) {
    options.instagram = coverUrl ? { reelCoverUrl: coverUrl } : { reelThumbOffset: 0 };
  }
  if (names.has("youtube") && youtubeUrl) options.youtube = { thumbnailUrl: youtubeUrl };
  if (names.has("tiktok")) {
    options.tiktok = coverUrl
      ? { ...tiktokBlock(0), videoCoverImageUrl: coverUrl }
      : tiktokBlock(0);
  }
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
export function postOptions(
  networks: string[],
  cover: CoverSource,
  coverUrl: string,
  youtubeUrl = coverUrl,
): NetworkOptions {
  const options = coverOptions(networks, cover, coverUrl, youtubeUrl);
  if (networks.some((network) => network.toLowerCase() === "tiktok") && !options.tiktok) {
    options.tiktok = tiktokBlock();
  }
  return options;
}
