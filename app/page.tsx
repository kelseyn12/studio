import Link from "next/link";
import { ActionCard } from "@/components/action-card";
import { LiveRefresh } from "@/components/live-refresh";
import { Shell } from "@/components/shell";
import { StudioMap } from "@/components/studio-map";
import { StatusPill } from "@/components/status-pill";
import { TodayBoard } from "@/components/today-board";
import { StorageMeter } from "@/components/storage-meter";
import { pickNextAction } from "@/lib/next-action";
import { machineCounts, studioBytes, studioSnapshot } from "@/lib/queries";
import { hasR2 } from "@/lib/r2";
import { studioUsage } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay } from "@/lib/dates";

export default async function TodayPage() {
  const today = startOfDay(new Date());
  const soon = addDays(today, 2);
  const [counts, snap, todayCards, chase, cutting, fileBytes] = await Promise.all([
    machineCounts(),
    studioSnapshot(),
    prisma.card.findMany({
      where: {
        OR: [
          { plannedDate: { gte: today } },
          { scheduledAt: { gte: today } },
          { status: { in: ["REVIEW", "READY", "FILMED", "SCRIPTED", "IDEA", "EDITING"] } },
        ],
      },
      include: { campaign: true, editor: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.card.findMany({
      where: {
        deadlineAt: { not: null, lte: soon },
        status: { notIn: ["READY", "POSTED", "DATA"] },
      },
      include: { editor: true },
      orderBy: { deadlineAt: "asc" },
    }),
    prisma.card.findMany({
      where: { status: "EDITING" },
      include: { editor: true },
      orderBy: { updatedAt: "desc" },
    }),
    studioBytes(),
  ]);
  const files = studioUsage(fileBytes);

  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
          <p className="mt-1 text-mute">Work, money, and both deal types. One next step on top.</p>
          <div className="mt-2">
            <LiveRefresh />
          </div>
        </div>
        <ActionCard action={pickNextAction(counts)} />
        {files.hot ? (
          <div className="max-w-xl">
            <StorageMeter bytes={files.bytes} r2={hasR2()} />
          </div>
        ) : null}
        <TodayBoard
          collected={snap.collected}
          pending={snap.pending}
          cutting={snap.cutting}
          review={snap.review}
          ready={counts.ready}
          tech={snap.tech}
          ugc={snap.ugc}
        />
        <StudioMap />
        {cutting.length > 0 ? (
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">With the editor</p>
            <div className="space-y-2">
              {cutting.map((card) => (
                <Link
                  key={card.id}
                  href={`/cards/${card.id}?step=editor`}
                  className="flex items-center justify-between rounded-2xl border border-line bg-panel px-5 py-4"
                >
                  <div>
                    <p className="font-medium">{card.title}</p>
                    <p className="text-sm text-mute">{card.editor?.name ?? "No editor"}</p>
                  </div>
                  <StatusPill status={card.status} />
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        {chase.length > 0 ? (
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">Due in 2 days</p>
            <div className="space-y-2">
              {chase.map((card) => (
                <Link
                  key={card.id}
                  href={`/cards/${card.id}`}
                  className="flex items-center justify-between rounded-2xl border border-line bg-panel px-5 py-4"
                >
                  <div>
                    <p className="font-medium">{card.title}</p>
                    <p className="text-sm text-mute">{card.editor?.name ?? "No editor"}</p>
                  </div>
                  <StatusPill status={card.status} />
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">Needs you</p>
          <div className="space-y-2">
            {todayCards.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-mute">
                Board is empty. Multiply a batch, or add a deal and one video.
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
