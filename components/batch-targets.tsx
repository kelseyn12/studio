"use client";

import { dealAccounts, describeTargets } from "@/lib/targets";

export type BatchAccount = {
  id: string;
  name: string;
  network: string;
  username: string;
  isActive: boolean;
  campaignId: string | null;
};

/** Deal · Format · Account rows on Mix settings. A deal with accounts posts to all of them, so no single pick. */
export function BatchTargets({
  campaigns,
  formats,
  accounts,
  campaignId,
  onCampaignChange,
  formatId,
  accountId,
  onAccountChange,
}: {
  campaigns: Array<{ id: string; name: string }>;
  formats: Array<{ id: string; name: string; campaignId: string }>;
  accounts: BatchAccount[];
  campaignId: string;
  onCampaignChange: (next: string) => void;
  formatId: string;
  accountId: string;
  onAccountChange: (next: string) => void;
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
        <Row label="Account">
          <select
            name="accountId"
            value={accountId}
            onChange={(event) => onAccountChange(event.target.value)}
            className="field max-w-xs"
            required
          >
            <option value="" disabled>
              Required — which account
            </option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </Row>
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
