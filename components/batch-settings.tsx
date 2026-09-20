"use client";

import { useMemo, useState } from "react";
import { outputCount, plannedMixes } from "@/lib/variations";

type Option = { id: string; name: string };

export function BatchSettings({
  batchId,
  name,
  hooks,
  bodies,
  ctas,
  defaults,
  campaigns,
  accounts,
}: {
  batchId: string;
  name: string;
  hooks: number;
  bodies: number;
  ctas: number;
  defaults: {
    allCombos: boolean;
    count: number;
    variants: number;
    speedOn: boolean;
    colorOn: boolean;
    zoomOn: boolean;
    intensity: string;
    campaignId: string;
    accountId: string;
  };
  campaigns: Option[];
  accounts: Option[];
}) {
  const [allCombos, setAllCombos] = useState(defaults.allCombos);
  const [count, setCount] = useState(defaults.count);
  const [variants, setVariants] = useState(defaults.variants);
  const mixes = useMemo(
    () => plannedMixes(hooks, bodies, ctas, allCombos, count),
    [hooks, bodies, ctas, allCombos, count],
  );
  const files = outputCount(mixes, variants);

  return (
    <form action={`/api/repurpose/${batchId}/generate`} method="post" className="space-y-6">
      <input type="hidden" name="name" value={name} />

      <div className="rounded-card bg-sun px-5 py-4 text-ink">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">This batch will make</p>
        <p className="mt-1 text-2xl font-semibold">
          {hooks} hooks × {bodies} bodies × {ctas} CTAs = {mixes} mixes
          {variants > 1 ? ` × ${variants} unique copies = ${files} videos` : ` = ${files} videos`}
        </p>
      </div>

      <section className="rounded-card border border-line bg-panel p-5">
        <p className="label">Step 2 · Mixes — different stories</p>
        <p className="mt-2 text-sm text-mute">
          Each mix is a new video: hook A + body 1 + CTA 2. Same body can sit under many hooks.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 text-sm md:col-span-2">
            <input
              type="checkbox"
              name="allCombos"
              checked={allCombos}
              onChange={(event) => setAllCombos(event.target.checked)}
            />
            Use every hook × body × CTA mix
          </label>
          <label>
            <span className="label">If not every mix, stop after</span>
            <input
              name="count"
              type="number"
              min={1}
              value={count}
              onChange={(event) => setCount(Number(event.target.value) || 1)}
              className="field"
            />
          </label>
        </div>
      </section>

      <section className="rounded-card border border-line bg-panel p-5">
        <p className="label">Step 3 · Unique copies — same story, different file</p>
        <p className="mt-2 text-sm text-mute">
          Platforms match identical files. Each copy gets a slightly different speed, light, or crop so
          the same mix can post more than once.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label>
            <span className="label">Copies of each mix</span>
            <input
              name="variants"
              type="number"
              min={1}
              max={8}
              value={variants}
              onChange={(event) => setVariants(Number(event.target.value) || 1)}
              className="field"
            />
          </label>
          <label>
            <span className="label">How hard</span>
            <select name="intensity" defaultValue={defaults.intensity} className="field">
              <option value="light">Light — harder for you to notice</option>
              <option value="hard">Hard — easier for the algorithm to see as new</option>
            </select>
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="speedOn" defaultChecked={defaults.speedOn} /> Speed
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="colorOn" defaultChecked={defaults.colorOn} /> Light / color
          </label>
          <label className="flex items-center gap-3 text-sm md:col-span-2">
            <input type="checkbox" name="zoomOn" defaultChecked={defaults.zoomOn} /> Crop / zoom jitter
          </label>
          <p className="text-sm text-mute md:col-span-2">
            Example: 3 hooks, 1 body, 2 CTAs, 2 copies = 12 videos. Copy 1 might be 102% speed. Copy 2
            might be 98% and a little warmer.
          </p>
        </div>
      </section>

      <section className="rounded-card border border-line bg-panel p-5">
        <p className="label">Where they land</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label>
            <span className="label">Deal</span>
            <select name="campaignId" defaultValue={defaults.campaignId} className="field">
              <option value="">None</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Account</span>
            <select name="accountId" defaultValue={defaults.accountId} className="field">
              <option value="">None</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <button
        className="rounded-xl bg-sun px-6 py-3 font-semibold text-ink disabled:opacity-40"
        disabled={files < 1}
      >
        Generate {files || ""} video{files === 1 ? "" : "s"} into Library
      </button>
      <p className="text-sm text-mute">
        Each file becomes a Ready card. Then Calendar can auto-space the week. Renders can take a few
        minutes.
      </p>
    </form>
  );
}
