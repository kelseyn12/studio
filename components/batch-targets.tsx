"use client";

import { dealAccounts, describeTargets, handle } from "@/lib/targets";

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
      {targets.length > 0 ? (
        <Row label="Posts to">
          <p className="max-w-xs text-right text-sm">{describeTargets(targets)}</p>
        </Row>
      ) : (
        <div className="border-t border-line pt-4">
          <p className="text-sm">Accounts this batch posts to</p>
          <p className="mt-1 text-xs text-mute">
            Check every app this should go to — IG and TikTok both, if that is the plan. Or put those accounts on this
            deal in Accounts and we fill this in.
          </p>
          <div className="mt-3 space-y-2">
            {accounts.map((account) => {
              const on = accountIds.includes(account.id);
              return (
                <label key={account.id} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="accountIds"
                    value={account.id}
                    checked={on}
                    onChange={() =>
                      onAccountIdsChange(on ? accountIds.filter((id) => id !== account.id) : [...accountIds, account.id])
                    }
                  />
                  <span>
                    {account.name || handle(account.username)}
                    <span className="text-mute"> · {account.network}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
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
