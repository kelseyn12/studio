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
  };
}) {
  return (
    <Link href={`/cards/${card.id}`} className="block rounded-xl bg-lift p-2">
      <p className="text-sm font-medium">{card.scheduledAt ? labelTime(card.scheduledAt) : "—"}</p>
      <p className="truncate text-xs text-mute">{card.account ? handle(card.account.username) : card.title}</p>
    </Link>
  );
}
