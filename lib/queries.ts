import { prisma } from "@/lib/prisma";
import { emptyCounts, statusToCountKey, type MachineCounts } from "@/lib/next-action";
import { addDays, startOfDay, startOfWeek } from "@/lib/dates";

export async function machineCounts(): Promise<MachineCounts> {
  const counts = emptyCounts();
  const grouped = await prisma.card.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  for (const row of grouped) {
    const key = statusToCountKey(row.status);
    if (key) counts[key] = row._count._all;
  }
  const today = startOfDay(new Date());
  counts.postedToday = await prisma.card.count({
    where: { postedAt: { gte: today } },
  });
  const deals = await prisma.campaign.findMany({
    where: { status: { in: ["ACTIVE", "TRIAL"] } },
    select: { postsPerDay: true, accountsAllowed: true },
  });
  counts.ready = await prisma.card.count({ where: { status: "READY", scheduledAt: null } });
  counts.totalCards = await prisma.card.count();
  counts.activeDeals = deals.length;
  counts.paidSlotsToday = deals.reduce(
    (sum, deal) => sum + deal.postsPerDay * deal.accountsAllowed,
    0,
  );
  return counts;
}

export async function weekHours(): Promise<number> {
  const review = await prisma.weeklyReview.findFirst({
    where: { weekStart: startOfWeek(new Date()) },
  });
  return review?.hours ?? 0;
}

export async function dashboardTotals() {
  const posted = await prisma.card.findMany({
    where: { status: { in: ["POSTED", "DATA"] } },
    select: {
      payoutCents: true,
      views: true,
      likes: true,
      comments: true,
      paid: true,
      approved: true,
    },
  });
  const revenue = posted.reduce((sum, card) => sum + (card.approved ? card.payoutCents : 0), 0);
  const projected = posted.reduce((sum, card) => sum + card.payoutCents, 0);
  const views = posted.reduce((sum, card) => sum + card.views, 0);
  const likes = posted.reduce((sum, card) => sum + card.likes, 0);
  const comments = posted.reduce((sum, card) => sum + card.comments, 0);
  const approved = posted.filter((card) => card.approved).length;
  return {
    revenue,
    projected,
    views,
    likes,
    comments,
    posted: posted.length,
    approvalRate: posted.length ? approved / posted.length : 0,
  };
}

export async function viewsByDay(days = 90) {
  const start = addDays(startOfDay(new Date()), -(days - 1));
  const cards = await prisma.card.findMany({
    where: { postedAt: { gte: start } },
    select: { postedAt: true, views: true, payoutCents: true, approved: true },
  });
  return Array.from({ length: days }, (_, index) => {
    const day = addDays(start, index);
    const key = day.toDateString();
    const rows = cards.filter((card) => card.postedAt && card.postedAt.toDateString() === key);
    return {
      date: day,
      views: rows.reduce((sum, card) => sum + card.views, 0),
      revenue: rows.reduce((sum, card) => sum + (card.approved ? card.payoutCents : 0), 0),
    };
  });
}

export async function studioSnapshot() {
  const [deals, payouts, capcut, review] = await Promise.all([
    prisma.campaign.findMany({
      where: { status: { in: ["ACTIVE", "TRIAL"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.card.findMany({
      where: { payoutCents: { gt: 0 } },
      select: { approved: true, payoutCents: true, campaign: { select: { kind: true } } },
    }),
    prisma.card.count({ where: { status: { in: ["FILMED", "EDITING"] } } }),
    prisma.card.count({ where: { status: "REVIEW" } }),
  ]);
  const collected = payouts.filter((row) => row.approved).reduce((sum, row) => sum + row.payoutCents, 0);
  const pending = payouts.filter((row) => !row.approved).reduce((sum, row) => sum + row.payoutCents, 0);
  const kindPay = (kind: "TECH" | "UGC") =>
    payouts.filter((row) => row.approved && row.campaign?.kind === kind).reduce((sum, row) => sum + row.payoutCents, 0);
  return {
    collected,
    pending,
    techCollected: kindPay("TECH"),
    ugcCollected: kindPay("UGC"),
    capcut,
    review,
    tech: deals.filter((deal) => deal.kind === "TECH"),
    ugc: deals.filter((deal) => deal.kind === "UGC"),
  };
}
