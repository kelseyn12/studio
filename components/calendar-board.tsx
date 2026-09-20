import { DaySlot } from "@/components/day-slot";
import { PostChip } from "@/components/post-chip";
import { sameDay, toInputDate } from "@/lib/dates";

type CardRow = {
  id: string;
  title: string;
  scheduledAt: Date | null;
  account: { username: string; nickname: string } | null;
};

export function CalendarBoard({
  days,
  cards,
  waiting,
  accounts,
  allowSlots,
}: {
  days: Date[];
  cards: CardRow[];
  waiting: Array<{ id: string; title: string }>;
  accounts: Array<{ id: string; username: string; nickname: string }>;
  allowSlots: boolean;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-7">
      {days.map((day) => {
        const dayCards = cards.filter((card) => card.scheduledAt && sameDay(card.scheduledAt, day));
        return (
          <section key={toInputDate(day)} className="rounded-card border border-line bg-panel p-3">
            <p className="text-xs uppercase text-mute">
              {day.toLocaleDateString("en-US", { weekday: "short" })} {day.getDate()}
            </p>
            <div className="mt-3 space-y-2">
              {dayCards.map((card) => (
                <PostChip key={card.id} card={card} />
              ))}
            </div>
            {allowSlots ? <DaySlot isoDay={toInputDate(day)} waiting={waiting} accounts={accounts} /> : null}
          </section>
        );
      })}
    </div>
  );
}
