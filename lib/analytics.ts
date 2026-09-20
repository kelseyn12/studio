export function parseAnalytics(body: Record<string, unknown>): { views: number; likes: number; comments: number } {
  const nested = (body.data as Record<string, unknown> | undefined) || (body.analytics as Record<string, unknown> | undefined) || body;
  const views = Number(nested.views ?? nested.impressions ?? nested.view_count ?? nested.playCount ?? 0);
  const likes = Number(nested.likes ?? nested.like_count ?? nested.likeCount ?? 0);
  const comments = Number(nested.comments ?? nested.comment_count ?? nested.commentCount ?? 0);
  return {
    views: Number.isFinite(views) ? views : 0,
    likes: Number.isFinite(likes) ? likes : 0,
    comments: Number.isFinite(comments) ? comments : 0,
  };
}
