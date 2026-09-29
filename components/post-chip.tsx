import Link from "next/link";
import { labelTime } from "@/lib/dates";
import { handle } from "@/lib/targets";

export function PostChip({
  card,
}: {
  card: {
    id: string;
    title: string;
    scheduledAt: Date | null;
    account: { username: string } | null;
    looks?: string;
  };
}) {
  return (
    <Link href={`/cards/${card.id}?step=live`} className="block rounded-xl bg-lift p-2">
      <p className="text-sm font-medium">{card.scheduledAt ? labelTime(card.scheduledAt) : "—"}</p>
      <p className="truncate text-xs text-mute">{card.account ? handle(card.account.username) : card.title}</p>
      {card.looks ? <p className="truncate text-xs text-mute">{card.looks}</p> : null}
    </Link>
  );
}
