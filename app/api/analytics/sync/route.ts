import { NextResponse } from "next/server";
import { closeLoop, parseAnalytics, postIdsFor, withHandYouTube, type PullStats } from "@/lib/analytics";
import { nextLanes } from "@/lib/formats";
import { getPost, getPostAnalytics, hasOutstand, postedAtFromPost } from "@/lib/outstand";
import { prisma } from "@/lib/prisma";
import { youtubePublicViews } from "@/lib/youtube-public";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readSession } from "@/lib/session";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "analytics-sync"), 6)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  if (!hasOutstand()) return NextResponse.json({ error: "Outstand key missing" }, { status: 400 });
  const cards = await prisma.card.findMany({
    where: { OR: [{ outstandPostId: { not: null } }, { youtubeUrl: { not: "" } }] },
    select: {
      id: true,
      outstandPostId: true,
      youtubeUrl: true,
      formatId: true,
      campaignId: true,
      publishes: { select: { outstandPostId: true } },
    },
  });
  let updated = 0;
  let posted = 0;
  const campaigns = new Set<string>();
  for (const card of cards) {
    // A cross-posted video is several Outstand posts (one per app look); its numbers are the sum.
    const postIds = postIdsFor(card);
    if (postIds.length === 0 && !card.youtubeUrl) continue;
    try {
      const stats: PullStats = { views: 0, likes: 0, comments: 0, youtubeViews: 0 };
      let publishedAt: Date | null = null;
      let gotStats = false;
      for (const postId of postIds) {
        try {
          const post = await getPost(postId);
          publishedAt = publishedAt ?? postedAtFromPost(post);
          const one = parseAnalytics(await getPostAnalytics(postId));
          stats.views += one.views;
          stats.likes += one.likes;
          stats.comments += one.comments;
          stats.youtubeViews += one.youtubeViews;
          gotStats = true;
        } catch {
          // An old or still-waiting post id must not throw away the apps that did publish.
        }
      }
      if (card.youtubeUrl && stats.youtubeViews === 0) {
        const hand = withHandYouTube(stats, await youtubePublicViews(card.youtubeUrl));
        if (hand.views !== stats.views) gotStats = true;
        stats.views = hand.views;
      }
      if (!gotStats) continue;
      const life = closeLoop({ publishedAt, views: stats.views });
      await prisma.card.update({
        where: { id: card.id },
        data: {
          views: stats.views,
          likes: stats.likes,
          comments: stats.comments,
          ...(life ?? {}),
        },
      });
      if (life) {
        posted += 1;
        if (card.campaignId) campaigns.add(card.campaignId);
      }
      updated += 1;
    } catch {
      /* keep going */
    }
  }
  for (const campaignId of campaigns) {
    await promoteCampaignWinner(campaignId);
  }
  return NextResponse.json({ ok: true, updated, posted });
}

async function promoteCampaignWinner(campaignId: string) {
  const [formats, top] = await Promise.all([
    prisma.format.findMany({ where: { campaignId } }),
    prisma.card.findFirst({
      where: { campaignId, formatId: { not: null }, status: { in: ["POSTED", "DATA"] } },
      orderBy: { views: "desc" },
      select: { formatId: true },
    }),
  ]);
  if (!top?.formatId || formats.length === 0) return;
  for (const row of nextLanes(formats, top.formatId)) {
    await prisma.format.update({ where: { id: row.id }, data: { lane: row.lane } });
  }
}

