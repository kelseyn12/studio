import Link from "next/link";
import { ActionCard } from "@/components/action-card";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { monthGrid, parseLocalDate, sameDay, toInputDate } from "@/lib/dates";
import { machineCounts } from "@/lib/queries";
import { pickNextAction } from "@/lib/next-action";
import { prisma } from "@/lib/prisma";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;
  const anchor = params.from ? parseLocalDate(params.from) : new Date();
  const days = monthGrid(anchor);
  const [cards, counts] = await Promise.all([
    prisma.card.findMany({
      where: { OR: [{ plannedDate: { not: null } }, { status: { in: ["IDEA", "SCRIPTED", "FILMED"] } }] },
      include: { account: true },
      orderBy: { plannedDate: "asc" },
    }),
    machineCounts(),
  ]);
  const monthLabel = anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const prev = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
  const next = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  const thisMonth = cards.filter(
    (card) => card.plannedDate && card.plannedDate.getMonth() === anchor.getMonth(),
  );

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Plan month</h1>
          <p className="mt-1 text-mute">Book what you will film. Live is the only room that publishes.</p>
        </div>
        <Link href="/cards/new" className="rounded-xl bg-sun px-4 py-2 text-sm font-semibold text-ink">
          Add one
        </Link>
      </div>
      <div className="mb-6">
        <ActionCard action={pickNextAction(counts)} />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/plan?from=${toInputDate(prev)}`} className="rounded-lg border border-line px-2 py-1 text-sm">
            ‹
          </Link>
          <p className="text-sm font-medium">{monthLabel}</p>
          <Link href={`/plan?from=${toInputDate(next)}`} className="rounded-lg border border-line px-2 py-1 text-sm">
            ›
          </Link>
        </div>
        <p className="text-xs text-mute">{thisMonth.length} booked this month</p>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <p key={day} className="px-2 text-xs uppercase text-mute">
            {day}
          </p>
        ))}
        {days.map((day) => {
          const dayCards = cards.filter((card) => card.plannedDate && sameDay(card.plannedDate, day));
          const inMonth = day.getMonth() === anchor.getMonth();
          return (
            <div
              key={toInputDate(day)}
              className={`min-h-32 rounded-2xl border border-line p-2 ${inMonth ? "bg-panel" : "opacity-40"}`}
            >
              <p className="mb-2 text-xs text-mute">{day.getDate()}</p>
              <div className="space-y-1">
                {dayCards.map((card) => (
                  <Link key={card.id} href={`/cards/${card.id}`} className="block rounded-lg bg-lift px-2 py-1">
                    <p className="truncate text-xs">{card.title}</p>
                    <p className="truncate text-[10px] text-mute">
                      {card.account ? `@${card.account.username}` : "No account"} · {card.status.toLowerCase()}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {cards.some((card) => !card.plannedDate) ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">No day yet</h2>
          <div className="space-y-2">
            {cards
              .filter((card) => !card.plannedDate)
              .map((card) => (
                <Link
                  key={card.id}
                  href={`/cards/${card.id}`}
                  className="flex items-center justify-between rounded-card border border-line bg-panel px-4 py-3"
                >
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
