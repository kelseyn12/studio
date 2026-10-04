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
 * Finished mixes with no day yet, closed under the batch name you typed. Open a mix for its
 * accounts. Each look stays a dropdown — closed it shows who is checked. A tap saves right away.
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
          <div className="space-y-2 border-t border-line px-3 py-3">
            {folder.cards.map((card) => (
              <details key={card.id} className="rounded-xl border border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{card.mixLabel}</span>
                  <Link
                    href={`/cards/${card.id}?step=live`}
                    onClick={(event) => event.stopPropagation()}
                    className="shrink-0 text-sm text-sun"
                  >
                    Cover + caption
                  </Link>
                </summary>
                <form
                  action={saveCardAccounts}
                  onChange={(event) => event.currentTarget.requestSubmit()}
                  className="grid gap-2 border-t border-line px-3 py-3 md:grid-cols-2"
                >
                  <input type="hidden" name="cardId" value={card.id} />
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
                </form>
              </details>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
