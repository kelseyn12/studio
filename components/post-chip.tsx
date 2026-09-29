import Link from "next/link";
import { labelTime, labelWhen } from "@/lib/dates";
import { handle } from "@/lib/targets";

export function PostChip({
  card,
  showDate = false,
}: {
  card: {
    id: string;
    title: string;
    scheduledAt: Date | null;
    account: { username: string } | null;
    looks?: string;
  };
  showDate?: boolean;
}) {
  const when = card.scheduledAt ? (showDate ? labelWhen(card.scheduledAt) : labelTime(card.scheduledAt)) : "—";
  return (
    <Link href={`/cards/${card.id}?step=live`} className="block rounded-xl bg-lift p-2">
      <p className="text-sm font-medium">{when}</p>
      <p className="truncate text-xs text-mute">{card.account ? handle(card.account.username) : card.title}</p>
      {card.looks ? <p className="truncate text-xs text-mute">{card.looks}</p> : null}
    </Link>
  );
}
