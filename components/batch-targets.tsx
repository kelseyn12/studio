"use client";

import { LookAccountPicks } from "@/components/look-account-picks";
import { dealAccounts } from "@/lib/targets";
import { LOOK_TAG } from "@/lib/text-style";

export type BatchAccount = {
  id: string;
  name: string;
  network: string;
  username: string;
  isActive: boolean;
  campaignId: string | null;
};

/** Deal · Format · Account rows on Mix settings. A deal with accounts posts to all of them. */
export function BatchTargets({
  campaigns,
  formats,
  accounts,
  campaignId,
  onCampaignChange,
  formatId,
  accountIds,
  onAccountIdsChange,
}: {
  campaigns: Array<{ id: string; name: string }>;
  formats: Array<{ id: string; name: string; campaignId: string }>;
  accounts: BatchAccount[];
  campaignId: string;
  onCampaignChange: (next: string) => void;
  formatId: string;
  accountIds: string[];
  onAccountIdsChange: (next: string[]) => void;
}) {
  const dealFormats = formats.filter((format) => format.campaignId === campaignId);
  const targets = dealAccounts(accounts, campaignId);
  return (
    <>
      <Row label="Deal">
        <select
          name="campaignId"
          value={campaignId}
          onChange={(event) => onCampaignChange(event.target.value)}
          className="field max-w-xs"
        >
          <option value="">None — shows as No deal in Library</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
      </Row>
      {dealFormats.length > 0 ? (
        <Row label="Format — so Numbers can score this batch">
          <select name="formatId" defaultValue={formatId} className="field max-w-xs">
            <option value="">No format</option>
            {dealFormats.map((format) => (
              <option key={format.id} value={format.id}>
                {format.name}
              </option>
            ))}
          </select>
        </Row>
      ) : null}
      <div className="space-y-4 border-t border-line pt-4">
        <p className="text-sm">Accounts this batch posts to</p>
        <p className="text-xs text-mute">
          Each mix is labeled IG / FB or TT / YT. Check every account that mix should go to — you can pick more than one.
        </p>
        {(["instagram", "tiktok"] as const).map((look) => {
          const selected = accountIds.length ? accountIds : targets.map((account) => account.id);
          return (
          <div key={look} className="space-y-2">
            <p className="text-xs font-semibold">For {LOOK_TAG[look]}</p>
            <LookAccountPicks
              look={look}
              tag={LOOK_TAG[look]}
              accounts={accounts}
              selectedIds={selected}
              controlled
              onToggle={(id, on) =>
                onAccountIdsChange(on ? [...selected, id] : selected.filter((accountId) => accountId !== id))
              }
            />
          </div>
          );
        })}
      </div>
    </>
  );
}

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0">
      <p className="text-sm">{label}</p>
      {children}
    </div>
  );
}
