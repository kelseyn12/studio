import { togglePaid } from "@/app/cards/[id]/actions";
import { formatMoney } from "@/lib/deals";

export function PaidButton({
  card,
}: {
  card: { id: string; approved: boolean; payoutCents: number };
}) {
  const amount = card.payoutCents > 0 ? ` ${formatMoney(card.payoutCents)}` : "";
  return (
    <form action={togglePaid}>
      <input type="hidden" name="id" value={card.id} />
      <button
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          card.approved ? "bg-live text-ink" : "border border-line text-mute"
        }`}
        title={card.approved ? "Tap if the brand has not paid after all" : "Tap when the brand pays for this video"}
      >
        {card.approved ? `Paid${amount}` : `Got paid?${amount}`}
      </button>
    </form>
  );
}
