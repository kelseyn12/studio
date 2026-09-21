import { multiplyWinner } from "@/app/analytics/actions";
import { RefreshStats } from "@/components/refresh-stats";
import { Shell } from "@/components/shell";
import { Spark } from "@/components/spark";
import { Stat } from "@/components/stat";
import { formatCompact, formatMoney } from "@/lib/deals";
import { dashboardTotals, studioSnapshot, viewsByDay } from "@/lib/queries";
import { prisma } from "@/lib/prisma";

export default async function AnalyticsPage() {
  const [totals, series, videos, accounts, snap] = await Promise.all([
    dashboardTotals(),
    viewsByDay(90),
    prisma.card.findMany({
      where: { OR: [{ status: { in: ["POSTED", "DATA"] } }, { postedAt: { not: null } }] },
      include: { campaign: true },
      orderBy: { views: "desc" },
      take: 8,
    }),
    prisma.socialAccount.findMany(),
    studioSnapshot(),
  ]);

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Numbers</h1>
          <p className="mt-1 text-mute">Real posted videos only. Pull Outstand so campaigns cannot leak what you are owed.</p>
        </div>
        <RefreshStats />
      </div>
      <section className="mb-8 grid gap-3 md:grid-cols-4">
        <Stat label="Collected" value={formatMoney(totals.revenue)} />
        <Stat label="Canvas / tech" value={formatMoney(snap.techCollected)} />
        <Stat label="Traditional UGC" value={formatMoney(snap.ugcCollected)} />
        <Stat label="Views" value={formatCompact(totals.views)} />
      </section>
      <div className="mb-8">
        <Spark points={series.map((row) => row.views)} label="Views · last 90 days" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-semibold">Top videos</h2>
          <div className="space-y-2">
            {videos.length === 0 ? (
              <p className="text-sm text-mute">Post, then log views on the video or sync from Outstand.</p>
            ) : (
              videos.map((video, index) => (
                <div key={video.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-panel px-4 py-3">
                  <a href={`/cards/${video.id}`} className="min-w-0 flex-1">
                    {index + 1}. {video.title}
                    {video.hook ? <p className="truncate text-xs text-mute">{video.hook}</p> : null}
                  </a>
                  <span className="shrink-0 text-sm text-mute">{formatCompact(video.views)}</span>
                  <form action={multiplyWinner}>
                    <input type="hidden" name="cardId" value={video.id} />
                    <button className="rounded-lg border border-line px-2 py-1 text-xs">Multiply</button>
                  </form>
                </div>
              ))
            )}
          </div>
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Accounts</h2>
          <div className="space-y-2">
            {accounts.map((account) => (
              <div key={account.id} className="rounded-2xl border border-line bg-panel px-4 py-3">
                @{account.username} · {account.network}
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
