import Link from "next/link";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { labelTime, weekGrid, sameDay } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function CalendarPage() {
  const days = weekGrid(new Date());
  const cards = await prisma.card.findMany({
    where: {
      OR: [{ scheduledAt: { not: null } }, { status: { in: ["READY", "POSTED"] } }],
    },
    include: { campaign: true, account: true },
    orderBy: { scheduledAt: "asc" },
  });

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Posting calendar</h1>
        <p className="mt-1 text-mute">The post already knows where it is going and when it goes live.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day) => {
          const dayCards = cards.filter((card) => card.scheduledAt && sameDay(card.scheduledAt, day));
          return (
            <section key={day.toISOString()} className="rounded-2xl border border-line bg-panel p-3">
              <p className="text-xs uppercase text-mute">
                {day.toLocaleDateString("en-US", { weekday: "short" })} {day.getDate()}
              </p>
              <div className="mt-3 space-y-2">
                {dayCards.map((card) => (
                  <Link key={card.id} href={`/cards/${card.id}`} className="block rounded-xl bg-lift p-2">
                    <p className="text-sm font-medium">{card.scheduledAt ? labelTime(card.scheduledAt) : "—"}</p>
                    <p className="truncate text-xs text-mute">{card.title}</p>
                    <StatusPill status={card.status} />
                  </Link>
                ))}
                <Link href="/cards/new" className="block rounded-xl border border-dashed border-line px-2 py-3 text-center text-xs text-mute">
                  + add
                </Link>
              </div>
            </section>
          );
        })}
      </div>
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Unscheduled ready</h2>
        <div className="space-y-2">
          {cards
            .filter((card) => card.status === "READY" && !card.scheduledAt)
            .map((card) => (
              <Link key={card.id} href={`/cards/${card.id}`} className="flex items-center justify-between rounded-2xl border border-line bg-panel px-4 py-3">
                <span>{card.title}</span>
                <StatusPill status={card.status} />
              </Link>
            ))}
        </div>
      </section>
    </Shell>
  );
}
