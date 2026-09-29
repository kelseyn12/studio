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
  const scheduled = cards
    .filter((card) => card.scheduledAt && card.status === "READY")
    .map((card) => ({ id: card.id, title: card.title }));
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
                {day.toLocaleDateString("en-US", { weekday: "short" })} {day.getDate()}
              </p>
              <div className="mt-3 space-y-2">
                {dayCards.map((card) => (
                  <PostChip key={card.id} card={card} />
                ))}
              </div>
              {allowSlots ? <DaySlot isoDay={toInputDate(day)} waiting={waiting} scheduled={scheduled} /> : null}
            </section>
          );
        })}
      </div>
    </DayPicks>
  );
}
