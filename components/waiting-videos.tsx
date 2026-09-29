"use client";

import Link from "next/link";
import { saveCardAccounts } from "@/app/calendar/actions";
import { LookAccountPicks } from "@/components/look-account-picks";
import type { FileLook } from "@/lib/card-desk";

type Account = { id: string; network: string; username: string; nickname: string; isActive: boolean };

/**
 * Finished mixes with no day yet. Each mix shows its IG · FB and TT · YT videos with account
 * checkboxes — a tap saves right away, so scheduling on a day always uses what you see here.
 */
export function WaitingVideos({
  cards,
  accounts,
}: {
  cards: Array<{ id: string; title: string; lookRows: FileLook[]; selectedIds: string[] }>;
  accounts: Account[];
}) {
  return (
    <div className="space-y-2">
      {cards.map((card) => (
        <form
          key={card.id}
          action={saveCardAccounts}
          onChange={(event) => event.currentTarget.requestSubmit()}
          className="rounded-card border border-line bg-panel px-4 py-3"
        >
          <input type="hidden" name="cardId" value={card.id} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 flex-1 basis-56 break-words text-sm font-medium">{card.title}</p>
            <Link href={`/cards/${card.id}?step=live`} className="shrink-0 text-sm text-sun">
              Cover + caption
            </Link>
          </div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {card.lookRows.map((row) => (
              <div key={row.look} className="space-y-2">
                <span className="inline-block rounded-full bg-sun px-2.5 py-0.5 text-xs font-semibold text-ink">
                  {row.tag}
                </span>
                <LookAccountPicks
                  look={row.look}
                  tag={row.tag}
                  accounts={accounts}
                  selectedIds={card.selectedIds}
                  compact
                />
              </div>
            ))}
          </div>
        </form>
      ))}
    </div>
  );
}
