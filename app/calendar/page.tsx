import Link from "next/link";
import { BulkForm } from "@/components/bulk-form";
import { CalendarBoard } from "@/components/calendar-board";
import { PostChip } from "@/components/post-chip";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import {
  addDays,
  labelWeekRange,
  monthGrid,
  parseLocalDate,
  startOfWeek,
  toInputDate,
  weekGrid,
} from "@/lib/dates";
import { prisma } from "@/lib/prisma";

const VIEWS = ["week", "month", "scheduled", "posted"] as const;
type View = (typeof VIEWS)[number];

function asView(value: string | undefined): View {
  return VIEWS.includes(value as View) ? (value as View) : "week";
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; from?: string }>;
}) {
  const params = await searchParams;
  const view = asView(params.view);
  const anchor = params.from ? parseLocalDate(params.from) : new Date();
  const weekStart = startOfWeek(anchor);
  const days = view === "month" ? monthGrid(anchor) : weekGrid(anchor);
  const weekEnd = addDays(weekStart, 7);
  const [cards, accounts] = await Promise.all([
    prisma.card.findMany({
      where: { OR: [{ scheduledAt: { not: null } }, { status: "READY" }] },
      include: { account: true },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.socialAccount.findMany({ where: { isActive: true } }),
  ]);
  const waiting = cards.filter((card) => card.status === "READY" && !card.scheduledAt);
  const parked = cards.filter((card) => card.scheduledAt && card.status !== "POSTED" && card.status !== "DATA");
  const posted = cards.filter((card) => card.status === "POSTED" || card.status === "DATA");
  const thisWeek = cards.filter(
    (card) => card.scheduledAt && card.scheduledAt >= weekStart && card.scheduledAt < weekEnd,
  );
  const href = (next: View, from = toInputDate(weekStart)) => `/calendar?view=${next}&from=${from}`;

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Live</h1>
          <p className="mt-1 text-mute">Ready files only. Plan month is for filming, not publishing.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/library" className="rounded-xl border border-line px-3 py-2 text-sm">
            Add videos
          </Link>
          <Link href="/cards/new" className="rounded-xl bg-sun px-3 py-2 text-sm font-semibold text-ink">
            New post
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={href(view, toInputDate(view === "month" ? new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1) : addDays(weekStart, -7)))}
            className="rounded-lg border border-line px-2 py-1 text-sm"
          >
            ‹
          </Link>
          <p className="text-sm font-medium">
            {view === "month"
              ? anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
              : labelWeekRange(weekStart)}
          </p>
          <Link
            href={href(view, toInputDate(view === "month" ? new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1) : addDays(weekStart, 7)))}
            className="rounded-lg border border-line px-2 py-1 text-sm"
          >
            ›
          </Link>
        </div>
        <div className="flex rounded-xl border border-line p-1">
          {VIEWS.map((tab) => (
            <Link
              key={tab}
              href={href(tab)}
              className={`rounded-lg px-3 py-1 text-sm capitalize ${view === tab ? "bg-sun font-semibold text-ink" : "text-mute"}`}
            >
              {tab}
            </Link>
          ))}
        </div>
        <p className="text-xs text-mute">
          {thisWeek.length} this week · {parked.length} scheduled · {posted.length} posted
        </p>
      </div>

      {accounts.length === 0 ? (
        <p className="mb-4 rounded-card border border-line bg-panel px-4 py-3 text-sm">
          Connect an account on <Link href="/connections" className="text-sun">Accounts</Link> before a slot can ship.
        </p>
      ) : null}

      <BulkForm waiting={waiting.length} accounts={accounts} startDate={toInputDate(weekStart)} />

      {view === "week" || view === "month" ? (
        <div className="mt-8">
          <CalendarBoard
            days={days}
            cards={cards}
            waiting={waiting}
            accounts={accounts}
            allowSlots={view === "week"}
          />
        </div>
      ) : (
        <section className="mt-8 space-y-2">
          {(view === "scheduled" ? parked : posted).map((card) => (
            <div key={card.id} className="flex items-center justify-between rounded-card border border-line bg-panel px-4 py-3">
              <PostChip card={card} />
              <StatusPill status={card.status} />
            </div>
          ))}
          {(view === "scheduled" ? parked : posted).length === 0 ? (
            <p className="text-sm text-mute">Nothing in this list yet. Park a ready video on a day.</p>
          ) : null}
        </section>
      )}

      {waiting.length > 0 && view === "week" ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">{waiting.length} ready, no time yet</h2>
          <p className="mb-3 text-sm text-mute">Pick a video on a day, or auto-space the whole batch above.</p>
        </section>
      ) : null}
    </Shell>
  );
}
