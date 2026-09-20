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
      where: { status: { in: ["POSTED", "DATA"] } },
      include: { campaign: true },
      orderBy: { views: "desc" },
      take: 8,
    }),
    prisma.socialAccount.findMany(),
    studioSnapshot(),
  ]);

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Numbers</h1>
      <p className="mt-1 mb-6 text-mute">Real posted videos only. Zeros mean nothing has shipped yet.</p>
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
              <p className="text-sm text-mute">Post, then log views on the card or sync from Outstand.</p>
            ) : (
              videos.map((video, index) => (
                <a key={video.id} href={`/cards/${video.id}`} className="flex items-center justify-between rounded-2xl border border-line bg-panel px-4 py-3">
                  <span>
                    {index + 1}. {video.title}
                  </span>
                  <span className="text-sm text-mute">{formatCompact(video.views)}</span>
                </a>
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
