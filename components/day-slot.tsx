import { parkCard } from "@/app/calendar/actions";

export function DaySlot({
  isoDay,
  waiting,
}: {
  isoDay: string;
  waiting: Array<{ id: string; title: string }>;
}) {
  if (waiting.length === 0) return null;
  return (
    <form action={parkCard} className="mt-3 space-y-2">
      <select name="cardId" className="field text-xs" required>
        {waiting.map((card) => (
          <option key={card.id} value={card.id}>
            {card.title}
          </option>
        ))}
      </select>
      <input name="scheduledAt" type="datetime-local" defaultValue={`${isoDay}T10:00`} className="field text-xs" required />
      <button className="w-full rounded-lg bg-sun px-2 py-1.5 text-xs font-semibold text-ink">Schedule here</button>
      <p className="text-[11px] text-mute">Posts to the accounts checked on the video — see the list below.</p>
    </form>
  );
}
