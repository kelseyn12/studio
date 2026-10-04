"use client";

import Link from "next/link";
import { saveCardAccounts } from "@/app/calendar/actions";
import { LookAccountPicks } from "@/components/look-account-picks";
import type { FileLook } from "@/lib/card-desk";
import { accountsForLook, handle, networkShort } from "@/lib/targets";

type Account = { id: string; network: string; username: string; nickname: string; isActive: boolean };

function pickedSummary(accounts: Account[], look: string, selectedIds: string[]): string {
  const chosen = accountsForLook(accounts, look).filter((account) => selectedIds.includes(account.id));
  if (chosen.length === 0) return "None checked";
  return chosen
    .map((account) => `${networkShort(account.network)} ${account.nickname || handle(account.username)}`)
    .join(" · ");
}

type WaitingCard = {
  id: string;
  mixLabel: string;
  lookRows: FileLook[];
  selectedIds: string[];
};

/**
 * Finished mixes with no day yet. The batch name is the dropdown. Opening it shows every mix
 * in that batch. Each look stays a dropdown — closed it shows who is checked. A tap saves right away.
 */
export function WaitingVideos({
  folders,
  accounts,
}: {
  folders: Array<{ key: string; title: string; cards: WaitingCard[] }>;
  accounts: Account[];
}) {
  return (
    <div className="space-y-2">
      {folders.map((folder) => (
        <details key={folder.key} className="rounded-card border border-line bg-panel">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <span className="font-medium">{folder.title}</span>
            <span className="shrink-0 text-sm text-mute">
              {folder.cards.length} {folder.cards.length === 1 ? "mix" : "mixes"} ▾
            </span>
          </summary>
          <div className="space-y-3 border-t border-line px-3 py-3">
            {folder.cards.map((card) => (
              <form
                key={card.id}
                action={saveCardAccounts}
                onChange={(event) => event.currentTarget.requestSubmit()}
                className="rounded-xl border border-line px-3 py-3"
              >
                <input type="hidden" name="cardId" value={card.id} />
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{card.mixLabel}</p>
                  <Link href={`/cards/${card.id}?step=live`} className="shrink-0 text-sm text-sun">
                    Cover + caption
                  </Link>
                </div>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {card.lookRows.map((row) => (
                    <details key={row.look} className="rounded-xl border border-line">
                      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm [&::-webkit-details-marker]:hidden">
                        <span className="shrink-0 rounded-full bg-sun px-2.5 py-0.5 text-xs font-semibold text-ink">
                          {row.tag}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-mute">
                          {pickedSummary(accounts, row.look, card.selectedIds)}
                        </span>
                        <span className="text-mute" aria-hidden>
                          ▾
                        </span>
                      </summary>
                      <div className="border-t border-line px-3 py-2">
                        <LookAccountPicks
                          look={row.look}
                          tag={row.tag}
                          accounts={accounts}
                          selectedIds={card.selectedIds}
                          compact
                        />
                      </div>
                    </details>
                  ))}
                </div>
              </form>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
