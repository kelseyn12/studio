export type PullStats = { views: number; likes: number; comments: number; youtubeViews: number };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function num(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Outstand returns `aggregated_metrics`, not a top-level `views` field. */
export function parseAnalytics(body: Record<string, unknown>): PullStats {
  const rows = Array.isArray(body.metrics_by_account) ? body.metrics_by_account : [];
  let youtubeViews = 0;
  for (const row of rows) {
    const record = asRecord(row);
    const account = asRecord(record?.social_account);
    if (account?.network !== "youtube") continue;
    youtubeViews += num(asRecord(record?.metrics)?.views);
  }
  const aggregated = asRecord(body.aggregated_metrics);
  if (aggregated) {
    return {
      views: num(aggregated.total_views ?? aggregated.total_impressions),
      likes: num(aggregated.total_likes),
      comments: num(aggregated.total_comments),
      youtubeViews,
    };
  }
  const nested = asRecord(body.data) || asRecord(body.analytics) || body;
  return {
    views: num(nested.views ?? nested.impressions ?? nested.view_count ?? nested.playCount),
    likes: num(nested.likes ?? nested.like_count ?? nested.likeCount),
    comments: num(nested.comments ?? nested.comment_count ?? nested.commentCount),
    youtubeViews,
  };
}

/** Add a YouTube Studio upload only when Outstand has no YouTube views for this video. */
export function withHandYouTube(stats: PullStats, handViews: number | null): PullStats {
  if (stats.youtubeViews > 0 || handViews == null) return stats;
  return { ...stats, views: stats.views + handViews };
}

export function closeLoop(input: {
  publishedAt: Date | null;
  views: number;
}): { status: "POSTED" | "DATA"; postedAt: Date } | null {
  if (!input.publishedAt) return null;
  return {
    status: input.views > 0 ? "DATA" : "POSTED",
    postedAt: input.publishedAt,
  };
}

/** Distinct Outstand post ids behind one video: the card's own plus every publish job's (cross-posts). */
export function postIdsFor(card: {
  outstandPostId: string | null;
  publishes: Array<{ outstandPostId: string | null }>;
}): string[] {
  const ids = [card.outstandPostId, ...card.publishes.map((job) => job.outstandPostId)].filter(
    (id): id is string => Boolean(id),
  );
  return [...new Set(ids)];
}
