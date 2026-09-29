import { parkCard } from "@/app/calendar/actions";
import { handle } from "@/lib/targets";

export function DaySlot({
  isoDay,
  waiting,
  accounts,
}: {
  isoDay: string;
  waiting: Array<{ id: string; title: string; looks?: string }>;
  accounts: Array<{ id: string; username: string; nickname: string }>;
}) {
  if (waiting.length === 0) return null;
  return (
    <form action={parkCard} className="mt-3 space-y-2">
      <select name="cardId" className="field text-xs" required>
        {waiting.map((card) => (
          <option key={card.id} value={card.id}>
            {card.looks ? `${card.title} · ${card.looks}` : card.title}
          </option>
        ))}
      </select>
      <input name="scheduledAt" type="datetime-local" defaultValue={`${isoDay}T10:00`} className="field text-xs" required />
      <select name="accountId" defaultValue="" className="field text-xs">
        <option value="">Already on the video</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.nickname ? `${account.nickname} · ` : ""}{handle(account.username)}
          </option>
        ))}
      </select>
      <button className="w-full rounded-lg bg-sun px-2 py-1.5 text-xs font-semibold text-ink">Schedule here</button>
    </form>
  );
}
