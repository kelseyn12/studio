import { describe, expect, it } from "vitest";
import { parseAnalytics, withHandYouTube } from "@/lib/analytics";

describe("parseAnalytics", () => {
  it("reads Outstand aggregated totals and YouTube views on their own", () => {
    const stats = parseAnalytics({
      aggregated_metrics: { total_views: 158, total_likes: 12, total_comments: 1 },
      metrics_by_account: [
        { social_account: { network: "instagram" }, metrics: { views: 158 } },
        { social_account: { network: "youtube" }, metrics: { views: 40 } },
      ],
    });
    expect(stats).toEqual({ views: 158, likes: 12, comments: 1, youtubeViews: 40 });
  });

  it("still reads a flat views field", () => {
    expect(parseAnalytics({ views: 9, likes: 2, comments: 1 }).views).toBe(9);
  });
});

describe("withHandYouTube", () => {
  it("adds a Studio upload when Outstand has no YouTube views", () => {
    const next = withHandYouTube({ views: 100, likes: 1, comments: 0, youtubeViews: 0 }, 50);
    expect(next.views).toBe(150);
  });

  it("does not add the same YouTube video twice", () => {
    const next = withHandYouTube({ views: 1258, likes: 1, comments: 0, youtubeViews: 1258 }, 1258);
    expect(next.views).toBe(1258);
  });
});
