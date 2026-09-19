import Link from "next/link";
import { ActionCard } from "@/components/action-card";
import { Shell } from "@/components/shell";
import { Spark } from "@/components/spark";
import { Stat } from "@/components/stat";
import { StatusPill } from "@/components/status-pill";
import { formatCompact, formatMoney } from "@/lib/deals";
import { pickNextAction } from "@/lib/next-action";
import { PIPELINE_STATUSES } from "@/lib/pipeline";
import { dashboardTotals, machineCounts, viewsByDay, weekHours } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/dates";

export default async function TodayPage() {
  const [counts, totals, hours, series, todayCards] = await Promise.all([
    machineCounts(),
    dashboardTotals(),
    weekHours(),
    viewsByDay(90),
    prisma.card.findMany({
      where: {
        OR: [
          { plannedDate: { gte: startOfDay(new Date()) } },
          { scheduledAt: { gte: startOfDay(new Date()) } },
          { status: { in: ["REVIEW", "READY", "FILMED"] } },
        ],
      },
      include: { campaign: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);
  const action = pickNextAction(counts);
  const dayTarget = 67000;
  const inventory = counts.ready + counts.review + counts.editing;

  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <p className="text-sm text-mute">$670 day · $20k month</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Today</h1>
        </div>
        <ActionCard action={action} />
        <section className="grid gap-3 md:grid-cols-4">
          <Stat
            label="Paid slots today"
            value={String(counts.paidSlotsToday)}
            hint={`${counts.postedToday} already posted`}
          />
          <Stat label="Inventory" value={String(inventory)} hint="Ready + review + editing" />
          <Stat
            label="Approval rate"
            value={`${Math.round(totals.approvalRate * 100)}%`}
            hint="Collected vs posted"
          />
          <Stat label="Hours this week" value={String(hours)} hint="Keep creator time low" />
        </section>
        <section className="grid gap-3 md:grid-cols-4">
          <Stat label="Collected" value={formatMoney(totals.revenue)} hint={`Projected ${formatMoney(totals.projected)}`} />
          <Stat label="Views" value={formatCompact(totals.views)} />
          <Stat label="Posted" value={String(totals.posted)} />
          <Stat label="Day target" value={formatMoney(dayTarget)} hint="Operational, not motivational" />
        </section>
        <Spark points={series.map((row) => row.views)} label="Views · last 90 days" />
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">Pipeline</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-8">
            {PIPELINE_STATUSES.map((status) => {
              const map: Record<string, number> = {
                IDEA: counts.idea,
                SCRIPTED: counts.scripted,
                FILMED: counts.filmed,
                EDITING: counts.editing,
                REVIEW: counts.review,
                READY: counts.ready,
                POSTED: counts.postedToday,
                DATA: totals.posted,
              };
              return (
                <Link
                  key={status}
                  href={`/pipeline?status=${status}`}
                  className="rounded-2xl border border-line bg-panel px-3 py-3"
                >
                  <StatusPill status={status} />
                  <p className="mt-3 text-2xl font-semibold">{map[status] ?? 0}</p>
                </Link>
              );
            })}
          </div>
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">Needs you</p>
            <Link href="/pipeline" className="text-sm text-sun">
              Open pipeline
            </Link>
          </div>
          <div className="space-y-2">
            {todayCards.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-mute">
                Nothing in motion. Plan a batch or add a deal.
              </p>
            ) : (
              todayCards.map((card) => (
                <Link
                  key={card.id}
                  href={`/cards/${card.id}`}
                  className="flex items-center justify-between rounded-2xl border border-line bg-panel px-5 py-4"
                >
                  <div>
                    <p className="font-medium">{card.title}</p>
                    <p className="text-sm text-mute">{card.campaign?.name ?? "No deal"}</p>
                  </div>
                  <StatusPill status={card.status} />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </Shell>
  );
}
