export type FormatLane = "WINNER" | "CHALLENGER" | "TEST";

/** A post counts as a win when it clears this many views. */
export const WIN_VIEWS = 10_000;

export type FormatScore = {
  id: string;
  name: string;
  lane: FormatLane;
  deal: string;
  posts: number;
  wins: number;
  winRate: number;
  avgViews: number;
  bestViews: number;
};

export function scoreFormats(
  formats: Array<{ id: string; name: string; lane: FormatLane; deal: string; views: number[] }>,
): FormatScore[] {
  return formats
    .map((format) => {
      const posts = format.views.length;
      const wins = format.views.filter((views) => views >= WIN_VIEWS).length;
      const total = format.views.reduce((sum, views) => sum + views, 0);
      return {
        id: format.id,
        name: format.name,
        lane: format.lane,
        deal: format.deal,
        posts,
        wins,
        winRate: posts ? Math.round((wins / posts) * 100) : 0,
        avgViews: posts ? Math.round(total / posts) : 0,
        bestViews: posts ? Math.max(...format.views) : 0,
      };
    })
    .sort((a, b) => b.posts - a.posts || b.avgViews - a.avgViews);
}

export function nextLanes(
  formats: Array<{ id: string; lane: FormatLane }>,
  winnerId: string,
): Array<{ id: string; lane: FormatLane }> {
  return formats.map((format) => ({
    id: format.id,
    lane: format.id === winnerId ? "WINNER" : format.lane === "WINNER" ? "CHALLENGER" : format.lane,
  }));
}
