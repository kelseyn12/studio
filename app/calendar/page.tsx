import Link from "next/link";
import { BulkForm } from "@/components/bulk-form";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { labelTime, sameDay, weekGrid } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function CalendarPage() {
  const days = weekGrid(new Date());
  const [cards, accounts] = await Promise.all([
    prisma.card.findMany({
      where: { OR: [{ scheduledAt: { not: null } }, { status: "READY" }] },
      include: { campaign: true, account: true },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.socialAccount.findMany({ where: { isActive: true } }),
  ]);
  const waiting = cards.filter((card) => card.status === "READY" && !card.scheduledAt);

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
        <p className="mt-1 text-mute">
          One click spaces the week and ships the file through Outstand. Stay on this laptop — they host the mp4.
        </p>
      </div>
      <BulkForm waiting={waiting.length} accounts={accounts} />
      <div className="mt-8 grid gap-3 md:grid-cols-7">
        {days.map((day) => {
          const dayCards = cards.filter((card) => card.scheduledAt && sameDay(card.scheduledAt, day));
          return (
            <section key={day.toISOString()} className="rounded-card border border-line bg-panel p-3">
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
              </div>
            </section>
          );
        })}
      </div>
      {waiting.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">{waiting.length} ready, no time yet</h2>
          <div className="space-y-2">
            {waiting.map((card) => (
              <Link key={card.id} href={`/cards/${card.id}`} className="flex items-center justify-between rounded-card border border-line bg-panel px-4 py-3">
                <span>{card.title}</span>
                <StatusPill status={card.status} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </Shell>
  );
}
