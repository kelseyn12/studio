import Link from "next/link";
import { labelTime, labelWhen } from "@/lib/dates";
import { handle } from "@/lib/targets";

export function PostChip({
  card,
  showDate = false,
  showTitle = false,
}: {
  card: {
    id: string;
    title: string;
    scheduledAt: Date | null;
    status?: string;
    account: { username: string } | null;
    looks?: string;
  };
  showDate?: boolean;
  showTitle?: boolean;
}) {
  const live = card.status === "POSTED" || card.status === "DATA";
  const when = card.scheduledAt ? (showDate ? labelWhen(card.scheduledAt) : labelTime(card.scheduledAt)) : "—";
  return (
    <Link href={`/cards/${card.id}?step=live`} className="block rounded-xl bg-lift p-2">
      {showTitle ? (
        <p className="truncate text-sm font-medium" title={card.title}>
          {card.title}
        </p>
      ) : null}
      {live ? <p className="text-xs font-semibold uppercase tracking-wide text-live">Posted</p> : null}
      <p className={showTitle || live ? "text-xs text-mute" : "text-sm font-medium"}>{when}</p>
      <p className="truncate text-xs text-mute">{card.account ? handle(card.account.username) : card.title}</p>
      {card.looks ? <p className="truncate text-xs text-mute">{card.looks}</p> : null}
    </Link>
  );
}
