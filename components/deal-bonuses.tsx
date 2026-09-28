"use client";

import { useState } from "react";
import { MAX_BONUSES, type ViewBonus } from "@/lib/deal-bonuses";

type Row = { key: number; views: string; pay: string };

/** Trackpad scrolling over a focused number field ticks the value; drop focus so money stays put. */
export const blurOnWheel = { onWheel: (event: React.WheelEvent<HTMLInputElement>) => event.currentTarget.blur() };

function toRows(bonuses: ViewBonus[]): Row[] {
  return bonuses.map((bonus, index) => ({ key: index, views: String(bonus.views), pay: (bonus.payoutCents / 100).toFixed(2) }));
}

/** View bonuses inside the deal form. Rows post as repeated bonusViews / bonusPay fields. */
export function DealBonuses({ bonuses }: { bonuses: ViewBonus[] }) {
  const [rows, setRows] = useState<Row[]>(() => toRows(bonuses));
  const [nextKey, setNextKey] = useState(bonuses.length);

  const update = (key: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const add = () => {
    setRows((current) => [...current, { key: nextKey, views: "", pay: "" }]);
    setNextKey((key) => key + 1);
  };

  return (
    <div className="text-sm md:col-span-2">
      <p>View bonuses</p>
      <p className="mt-1 text-xs text-mute">
        Paid once per video that crosses the mark. Counts toward They owe you as soon as the views come in.
      </p>
      <div className="mt-2 space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-2">
            <span className="text-mute">$</span>
            <input
              name="bonusPay"
              type="number"
              min={0}
              step="0.01"
              value={row.pay}
              onChange={(event) => update(row.key, { pay: event.target.value })}
              placeholder="250"
              aria-label="Bonus dollars"
              {...blurOnWheel}
              className="field max-w-32"
            />
            <span className="text-mute">at</span>
            <input
              name="bonusViews"
              type="number"
              min={0}
              step={1000}
              value={row.views}
              onChange={(event) => update(row.key, { views: event.target.value })}
              placeholder="100000"
              aria-label="Views needed"
              {...blurOnWheel}
              className="field max-w-40"
            />
            <span className="text-mute">views</span>
            <button
              type="button"
              onClick={() => setRows((current) => current.filter((other) => other.key !== row.key))}
              className="ml-auto text-xs text-mute underline"
            >
              Remove
            </button>
          </div>
        ))}
        {rows.length < MAX_BONUSES ? (
          <button type="button" onClick={add} className="rounded-xl border border-line px-3 py-2 text-xs font-semibold">
            {rows.length === 0 ? "Add a view bonus" : "Add another"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
