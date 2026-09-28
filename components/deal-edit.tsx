"use client";

import { useState } from "react";
import { updateDeal } from "@/app/campaigns/[id]/actions";
import { blurOnWheel, DealBonuses } from "@/components/deal-bonuses";
import { parseBonuses, perVideoCents } from "@/lib/deal-bonuses";
import { formatMoney, formatMoneyExact } from "@/lib/deals";

type Deal = {
  id: string;
  name: string;
  brand: string;
  status: string;
  basePayCents: number;
  monthlyPayCents: number;
  cpmCents: number;
  bonusesJson: string;
  videoCount: number;
  postsPerDay: number;
  postsPerDayMax: number;
  accountsAllowed: number;
  deliverables: string;
};

const dollars = (cents: number) => (cents / 100).toFixed(2);

function Field({ label, hint, children, wide }: { label: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`text-sm ${wide ? "md:col-span-2" : ""}`}>
      {label}
      {children}
      {hint ? <span className="mt-1 block text-xs text-mute">{hint}</span> : null}
    </label>
  );
}

export function DealEdit({ deal }: { deal: Deal }) {
  const [monthlyPay, setMonthlyPay] = useState(deal.monthlyPayCents > 0 ? dollars(deal.monthlyPayCents) : "");
  const [videoCount, setVideoCount] = useState(String(deal.videoCount));
  const monthlyCents = Math.round(Number(monthlyPay || 0) * 100);
  const flat = monthlyCents > 0;
  const perVideo = perVideoCents(monthlyCents, Number(videoCount) || 1);

  return (
    <details className="mb-8 rounded-card border border-line bg-panel">
      <summary className="cursor-pointer px-5 py-4 font-semibold">Edit this deal</summary>
      <form action={updateDeal} className="grid gap-4 px-5 pb-5 md:grid-cols-2">
        <input type="hidden" name="id" value={deal.id} />
        <Field label="Deal name">
          <input name="name" defaultValue={deal.name} className="field mt-1" required />
        </Field>
        <Field label="Brand">
          <input name="brand" defaultValue={deal.brand} className="field mt-1" />
        </Field>

        <p className="label md:col-span-2">How they pay</p>
        <Field label="Flat pay for the month ($)" hint="Leave 0 if they pay per video instead.">
          <input
            name="monthlyPay"
            {...blurOnWheel}
            type="number"
            min={0}
            step="0.01"
            value={monthlyPay}
            onChange={(event) => setMonthlyPay(event.target.value)}
            placeholder="0.00"
            className="field mt-1"
          />
        </Field>
        <Field label="Videos promised" hint={flat ? "For the month. The flat pay spreads over these." : "What Delivered counts toward."}>
          <input
            name="videoCount"
            {...blurOnWheel}
            type="number"
            min={1}
            value={videoCount}
            onChange={(event) => setVideoCount(event.target.value)}
            className="field mt-1"
          />
        </Field>
        {flat ? (
          <p className="rounded-xl bg-lift px-4 py-3 text-sm md:col-span-2">
            Each video is worth <span className="font-semibold">{formatMoneyExact(perVideo)}</span> — {formatMoney(monthlyCents)} ÷{" "}
            {Number(videoCount) || 1}. That is what gets stamped on every video you post.
          </p>
        ) : (
          <Field label="Pay per video ($)" hint="Stamped on every video you post for this deal.">
            <input name="basePay" type="number" {...blurOnWheel} min={0} step="0.01" defaultValue={dollars(deal.basePayCents)} className="field mt-1" />
          </Field>
        )}
        <Field label="CPM — $ per 1,000 views" hint="0 if the deal has none.">
          <input name="cpm" type="number" {...blurOnWheel} min={0} step="0.01" defaultValue={dollars(deal.cpmCents)} className="field mt-1" />
        </Field>
        <DealBonuses bonuses={parseBonuses(deal.bonusesJson)} />

        <p className="label md:col-span-2">How much you post</p>
        <Field label="Posts per day you owe" hint="Today asks you for this many.">
          <input name="postsPerDay" type="number" {...blurOnWheel} min={1} defaultValue={deal.postsPerDay} className="field mt-1" />
        </Field>
        <Field label="Most they allow per day" hint="0 if there is no cap. 28 a week is 4 a day.">
          <input name="postsPerDayMax" type="number" {...blurOnWheel} min={0} defaultValue={deal.postsPerDayMax} className="field mt-1" />
        </Field>
        <Field
          label="Accounts allowed"
          hint="One video going to IG + FB + TT + YT is one post here. Keep this at 1 and put the accounts on the deal in Accounts."
        >
          <input name="accountsAllowed" type="number" {...blurOnWheel} min={1} defaultValue={deal.accountsAllowed} className="field mt-1" />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={deal.status} className="field mt-1">
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="ENDED">Ended</option>
          </select>
        </Field>
        <Field label="What they expect" wide>
          <textarea name="deliverables" defaultValue={deal.deliverables} className="field mt-1 min-h-20" />
        </Field>
        <button className="rounded-xl bg-sun px-4 py-3 font-semibold text-ink md:col-span-2">Save deal</button>
      </form>
    </details>
  );
}
