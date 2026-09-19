import Link from "next/link";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { monthGrid, sameDay } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function PlanPage() {
  const days = monthGrid(new Date());
  const cards = await prisma.card.findMany({
    where: { plannedDate: { not: null } },
    include: { campaign: true },
  });

  return (
    <Shell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Plan</h1>
          <p className="mt-1 text-mute">Plan the month in one sitting. Every card already knows the brand, status, and time.</p>
        </div>
        <Link href="/cards/new" className="rounded-xl bg-sun px-4 py-2 text-sm font-semibold text-ink">
          Add cards
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <p key={day} className="px-2 text-xs uppercase text-mute">
            {day}
          </p>
        ))}
        {days.map((day) => {
          const dayCards = cards.filter((card) => card.plannedDate && sameDay(card.plannedDate, day));
          const inMonth = day.getMonth() === new Date().getMonth();
          return (
            <div
              key={day.toISOString()}
              className={`min-h-32 rounded-2xl border border-line p-2 ${inMonth ? "bg-panel" : "opacity-40"}`}
            >
              <p className="mb-2 text-xs text-mute">{day.getDate()}</p>
              <div className="space-y-1">
                {dayCards.map((card) => (
                  <Link key={card.id} href={`/cards/${card.id}`} className="block rounded-lg bg-lift px-2 py-1">
                    <p className="truncate text-xs">{card.title}</p>
                    <StatusPill status={card.status} />
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
