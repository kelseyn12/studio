"use client";

import { useState } from "react";
import { saveAccount } from "@/app/connections/actions";

type Deal = { id: string; name: string };

/** Label + deal for one account. Tapping a deal saves immediately — no extra Save for the deal. */
export function AccountDeal({
  id,
  nickname,
  campaignId,
  campaigns,
}: {
  id: string;
  nickname: string;
  campaignId: string | null;
  campaigns: Deal[];
}) {
  const [label, setLabel] = useState(nickname);
  const [deal, setDeal] = useState(campaignId ?? "");
  const [note, setNote] = useState("");

  async function save(nextDeal: string) {
    const previous = deal;
    setDeal(nextDeal);
    setNote("Saving…");
    const data = new FormData();
    data.set("id", id);
    data.set("nickname", label);
    data.set("campaignId", nextDeal);
    try {
      await saveAccount(data);
      setNote("Saved");
    } catch {
      setDeal(previous);
      setNote("Didn't save — tap it again");
    }
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void save(deal);
      }}
    >
      <input
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        placeholder="Label — personal, OpenArt…"
        className="field !w-52"
      />
      <div className="flex flex-wrap gap-1">
        <DealButton active={deal === ""} onClick={() => void save("")}>
          Personal
        </DealButton>
        {campaigns.map((campaign) => (
          <DealButton key={campaign.id} active={deal === campaign.id} onClick={() => void save(campaign.id)}>
            {campaign.name}
          </DealButton>
        ))}
      </div>
      <button className="rounded-xl border border-line px-3 py-2 text-sm">Save label</button>
      {note ? <span className="text-xs text-sun">{note}</span> : null}
    </form>
  );
}

function DealButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-sun px-3 py-1.5 text-sm font-semibold text-ink"
          : "rounded-full border border-line px-3 py-1.5 text-sm text-mute"
      }
    >
      {children}
    </button>
  );
}
