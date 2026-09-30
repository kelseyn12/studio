import Link from "next/link";
import { DayPicks } from "@/components/day-picks";
import { DaySlot } from "@/components/day-slot";
import { PostChip } from "@/components/post-chip";
import { sameDay, toInputDate } from "@/lib/dates";

type CardRow = {
  id: string;
  title: string;
  scheduledAt: Date | null;
  account: { username: string; nickname: string } | null;
  looks?: string;
  status?: string;
  held?: string;
  missed?: string;
};

export function CalendarBoard({
  days,
  cards,
  waiting,
  allowSlots,
  month,
}: {
  days: Date[];
  cards: CardRow[];
  waiting: Array<{ id: string; title: string }>;
  allowSlots: boolean;
  month?: Date;
}) {
  const scheduled = cards.filter((card) => card.scheduledAt).map((card) => ({ id: card.id, title: card.title }));
  return (
    <DayPicks waitingIds={waiting.map((card) => card.id)}>
      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day) => {
          const dayCards = cards.filter((card) => card.scheduledAt && sameDay(card.scheduledAt, day));
          const outside = month ? day.getMonth() !== month.getMonth() : false;
          return (
            <section
              key={toInputDate(day)}
              className={`rounded-card border border-line bg-panel p-3 ${outside ? "opacity-40" : ""}`}
            >
              <p className="text-xs uppercase text-mute">
                {month && !allowSlots ? (
                  <Link href={`/calendar?view=week&from=${toInputDate(day)}`} className="hover:text-sun">
                    {day.toLocaleDateString("en-US", { weekday: "short" })} {day.getDate()}
                  </Link>
                ) : (
                  <>
                    {day.toLocaleDateString("en-US", { weekday: "short" })} {day.getDate()}
                  </>
                )}
              </p>
              <div className="mt-3 space-y-2">
                {dayCards.map((card) => (
                  <PostChip key={card.id} card={card} showTitle />
                ))}
              </div>
              {allowSlots ? (
                <DaySlot isoDay={toInputDate(day)} waiting={waiting} scheduled={scheduled} taken={dayCards.length} />
              ) : null}
            </section>
          );
        })}
      </div>
    </DayPicks>
  );
}
