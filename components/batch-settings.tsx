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
  const [speedOn, setSpeedOn] = useState(defaults.speedOn);
  const [colorOn, setColorOn] = useState(defaults.colorOn);
  const [zoomOn, setZoomOn] = useState(defaults.zoomOn);
  const mixes = useMemo(
    () => plannedMixes(hooks, bodies, ctas, allCombos, count),
    [hooks, bodies, ctas, allCombos, count],
  );
  const files = outputCount(mixes, variants);

  return (
    <form action={`/api/repurpose/${batchId}/generate`} method="post" className="space-y-6">
      <input type="hidden" name="name" value={name} />
      {allCombos ? <input type="hidden" name="allCombos" value="on" /> : null}
      {speedOn ? <input type="hidden" name="speedOn" value="on" /> : null}
      {colorOn ? <input type="hidden" name="colorOn" value="on" /> : null}
      {zoomOn ? <input type="hidden" name="zoomOn" value="on" /> : null}

      <div className="rounded-card bg-sun px-5 py-4 text-ink">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">This batch will make</p>
        <p className="mt-1 text-2xl font-semibold">
          {hooks} hooks × {bodies} bodies × {ctas} CTAs = {mixes} mixes
          {variants > 1 ? ` × ${variants} unique copies = ${files} videos` : ` = ${files} videos`}
        </p>
      </div>

      <section className="rounded-card border border-line bg-panel p-5">
        <p className="label">Mix settings</p>
        <p className="mt-2 text-sm text-mute">
          Mixes change the story. Unique copies change the file so platforms do not match them.
        </p>
        <div className="mt-5 space-y-4">
          <Row label="Every mix">
            <Toggle on={allCombos} onClick={() => setAllCombos(!allCombos)} />
          </Row>
          <Row label="If not every mix, stop after">
            <input
              name="count"
              type="number"
              min={1}
              value={count}
              onChange={(event) => setCount(Number(event.target.value) || 1)}
              className="field max-w-28"
            />
          </Row>
          <Row label="Unique copies of each mix">
            <input
              name="variants"
              type="number"
              min={1}
              max={8}
              value={variants}
              onChange={(event) => setVariants(Number(event.target.value) || 1)}
              className="field max-w-28"
            />
          </Row>
          <Row label="Speed variation">
            <Toggle on={speedOn} onClick={() => setSpeedOn(!speedOn)} />
          </Row>
          <Row label="Light / color">
            <Toggle on={colorOn} onClick={() => setColorOn(!colorOn)} />
          </Row>
          <Row label="Crop / zoom jitter">
            <Toggle on={zoomOn} onClick={() => setZoomOn(!zoomOn)} />
          </Row>
          <Row label="How hard">
            <select name="intensity" defaultValue={defaults.intensity} className="field max-w-xs">
              <option value="light">Light — harder for you to notice</option>
              <option value="hard">Hard — easier for the algorithm to see as new</option>
            </select>
          </Row>
          <Row label="Deal">
            <select name="campaignId" defaultValue={defaults.campaignId} className="field max-w-xs">
              <option value="">None</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Account">
            <select name="accountId" defaultValue={defaults.accountId} className="field max-w-xs">
              <option value="">None</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </Row>
        </div>
        <button
          className="mt-6 rounded-xl bg-sun px-6 py-3 font-semibold text-ink disabled:opacity-40"
          disabled={files < 1}
        >
          Generate {files || ""} video{files === 1 ? "" : "s"}
        </button>
        <p className="mt-3 text-sm text-mute">
          Each file becomes a Ready card. Calendar can space the week. Renders can take a few minutes.
        </p>
      </section>
    </form>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0">
      <p className="text-sm">{label}</p>
      {children}
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold ${on ? "bg-sun text-ink" : "bg-lift text-mute"}`}
    >
      {on ? "On" : "Off"}
    </button>
  );
}
