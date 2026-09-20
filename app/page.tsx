import Link from "next/link";
import { ActionCard } from "@/components/action-card";
import { Shell } from "@/components/shell";
import { StudioMap } from "@/components/studio-map";
import { StatusPill } from "@/components/status-pill";
import { pickNextAction } from "@/lib/next-action";
import { machineCounts } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/dates";

export default async function TodayPage() {
  const [counts, todayCards] = await Promise.all([
    machineCounts(),
    prisma.card.findMany({
      where: {
        OR: [
          { plannedDate: { gte: startOfDay(new Date()) } },
          { scheduledAt: { gte: startOfDay(new Date()) } },
          { status: { in: ["REVIEW", "READY", "FILMED", "SCRIPTED", "IDEA"] } },
        ],
      },
      include: { campaign: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
          <p className="mt-1 text-mute">One next step. The rest of the nav can wait.</p>
        </div>
        <ActionCard action={pickNextAction(counts)} />
        <StudioMap />
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">Needs you</p>
          <div className="space-y-2">
            {todayCards.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-mute">
                Board is empty. Multiply a batch, or add one card on Plan month.
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
                    <p className="text-sm text-mute">{card.campaign?.name ?? "Personal"}</p>
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
