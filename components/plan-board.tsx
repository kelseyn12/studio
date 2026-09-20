"use client";

import { useRouter } from "next/navigation";

export type PlanChip = {
  id: string;
  title: string;
  status: string;
  plannedDate: string | null;
  handle: string;
};

export function PlanBoard({
  days,
  cards,
}: {
  days: Array<{ iso: string; date: number; inMonth: boolean }>;
  cards: PlanChip[];
}) {
  const router = useRouter();

  async function move(cardId: string, iso: string) {
    await fetch("/api/plan/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, plannedDate: iso }),
    });
    router.refresh();
  }

  const loose = cards.filter((card) => !card.plannedDate);

  return (
    <div>
      <div className="grid grid-cols-7 gap-2">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <p key={day} className="px-2 text-xs uppercase text-mute">
          {day}
        </p>
      ))}
      {days.map((day) => {
        const dayCards = cards.filter((card) => card.plannedDate === day.iso);
        return (
          <div
            key={day.iso}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const id = event.dataTransfer.getData("text/card-id");
              if (id) void move(id, day.iso);
            }}
            className={`min-h-32 rounded-2xl border border-line p-2 ${day.inMonth ? "bg-panel" : "opacity-40"}`}
          >
            <p className="mb-2 text-xs text-mute">{day.date}</p>
            <div className="space-y-1">
              {dayCards.map((card) => (
                <a
                  key={card.id}
                  href={`/cards/${card.id}`}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/card-id", card.id)}
                  className="block cursor-grab rounded-lg bg-lift px-2 py-1"
                >
                  <p className="truncate text-xs">{card.title}</p>
                  <p className="truncate text-[10px] text-mute">
                    {card.handle} · {card.status.toLowerCase()}
                  </p>
                </a>
              ))}
            </div>
          </div>
        );
      })}
      </div>
      {loose.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">No day yet — drag onto a date</h2>
          <div className="space-y-2">
            {loose.map((card) => (
              <div
                key={card.id}
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/card-id", card.id)}
                className="cursor-grab rounded-card border border-line bg-panel px-4 py-3"
              >
                <p>{card.title}</p>
                <p className="text-xs text-mute">{card.handle}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
