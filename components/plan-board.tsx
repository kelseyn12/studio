"use client";

import { useRouter } from "next/navigation";
import { deleteVideo } from "@/app/cards/[id]/actions";

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

  async function move(cardId: string, iso: string | null) {
    await fetch("/api/plan/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, plannedDate: iso }),
    });
    router.refresh();
  }

  async function remove(cardId: string) {
    if (!window.confirm("Delete this video? This cannot be undone.")) return;
    const form = new FormData();
    form.set("id", cardId);
    await deleteVideo(form);
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
                <Chip key={card.id} card={card} onDelete={() => void remove(card.id)} />
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
                className="flex cursor-grab items-center justify-between rounded-card border border-line bg-panel px-4 py-3"
              >
                <div>
                  <p>{card.title}</p>
                  <p className="text-xs text-mute">{card.handle}</p>
                </div>
                <button type="button" onClick={() => void remove(card.id)} className="text-sm text-mute">
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Chip({ card, onDelete }: { card: PlanChip; onDelete: () => void }) {
  return (
    <div
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/card-id", card.id)}
      className="rounded-lg bg-lift px-2 py-1"
    >
      <div className="flex items-start justify-between gap-1">
        <a href={`/cards/${card.id}`} className="min-w-0 flex-1 cursor-grab">
          <p className="truncate text-xs">{card.title}</p>
          <p className="truncate text-[10px] text-mute">
            {card.handle} · {card.status.toLowerCase()}
          </p>
        </a>
        <button type="button" onClick={onDelete} className="shrink-0 text-xs text-mute" aria-label="Delete video">
          ×
        </button>
      </div>
    </div>
  );
}
