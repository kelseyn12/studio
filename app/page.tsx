import Link from "next/link";
import { ActionCard } from "@/components/action-card";
import { Shell } from "@/components/shell";
import { StudioMap } from "@/components/studio-map";
import { StatusPill } from "@/components/status-pill";
import { TodayBoard } from "@/components/today-board";
import { pickNextAction } from "@/lib/next-action";
import { machineCounts, studioSnapshot } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/dates";

export default async function TodayPage() {
  const [counts, snap, todayCards] = await Promise.all([
    machineCounts(),
    studioSnapshot(),
    prisma.card.findMany({
      where: {
        OR: [
          { plannedDate: { gte: startOfDay(new Date()) } },
          { scheduledAt: { gte: startOfDay(new Date()) } },
          { status: { in: ["REVIEW", "READY", "FILMED", "SCRIPTED", "IDEA", "EDITING"] } },
        ],
      },
      include: { campaign: true, editor: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
          <p className="mt-1 text-mute">Work, money, and both deal types. One next step on top.</p>
        </div>
        <ActionCard action={pickNextAction(counts)} />
        <TodayBoard
          collected={snap.collected}
          pending={snap.pending}
          capcut={snap.capcut}
          review={snap.review}
          ready={counts.ready}
          tech={snap.tech}
          ugc={snap.ugc}
        />
        <StudioMap />
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">Needs you</p>
          <div className="space-y-2">
            {todayCards.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-mute">
                Board is empty. Multiply a batch, or add a deal and one card.
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
                    <p className="text-sm text-mute">
                      {card.campaign ? `${card.campaign.brand || card.campaign.name}` : "Personal"}
                      {card.editor ? ` · ${card.editor.name}` : ""}
                    </p>
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
