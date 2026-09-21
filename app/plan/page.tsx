import Link from "next/link";
import { ActionCard } from "@/components/action-card";
import { PlanBoard } from "@/components/plan-board";
import { Shell } from "@/components/shell";
import { monthGrid, parseLocalDate, toInputDate } from "@/lib/dates";
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
          <h1 className="text-3xl font-semibold tracking-tight">Film days</h1>
          <p className="mt-1 text-mute">Drag a video onto a day. That is when you film, not when it posts. Open a video to delete it, or hit × on the chip.</p>
        </div>
        <Link href="/cards/new" className="rounded-xl bg-sun px-4 py-2 text-sm font-semibold text-ink">
          Add a video
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
      <PlanBoard
        days={days.map((day) => ({
          iso: toInputDate(day),
          date: day.getDate(),
          inMonth: day.getMonth() === anchor.getMonth(),
        }))}
        cards={cards.map((card) => ({
          id: card.id,
          title: card.title,
          status: card.status,
          plannedDate: card.plannedDate ? toInputDate(card.plannedDate) : null,
          handle: card.account ? `@${card.account.username}` : "No account",
        }))}
      />
    </Shell>
  );
}
