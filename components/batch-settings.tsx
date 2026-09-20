"use client";

import { useMemo, useState } from "react";
import { outputCount, plannedMixes, variationFor } from "@/lib/variations";

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
    speedAmt: number;
    colorAmt: number;
    cropAmt: number;
    campaignId: string;
    accountId: string;
  };
  campaigns: Option[];
  accounts: Option[];
}) {
  const [allCombos, setAllCombos] = useState(defaults.allCombos);
  const [count, setCount] = useState(defaults.count);
  const [variants, setVariants] = useState(defaults.variants);
  const [speedAmt, setSpeedAmt] = useState(defaults.speedAmt);
  const [colorAmt, setColorAmt] = useState(defaults.colorAmt);
  const [cropAmt, setCropAmt] = useState(defaults.cropAmt);
  const mixes = useMemo(
    () => plannedMixes(hooks, bodies, ctas, allCombos, count),
    [hooks, bodies, ctas, allCombos, count],
  );
  const files = outputCount(mixes, variants);
  const preview = variationFor(1, { speedAmt, colorAmt, cropAmt });

  return (
    <form action={`/api/repurpose/${batchId}/generate`} method="post" className="space-y-6">
      <input type="hidden" name="name" value={name} />
      {allCombos ? <input type="hidden" name="allCombos" value="on" /> : null}

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
          Mixes change the story. If every mix is off, we shuffle and take that many. Sliders change the file so platforms do not match copies.
        </p>
        <div className="mt-5 space-y-4">
          <Row label="Every mix">
            <button
              type="button"
              onClick={() => setAllCombos(!allCombos)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${allCombos ? "bg-sun text-ink" : "bg-lift text-mute"}`}
            >
              {allCombos ? "On" : "Off"}
            </button>
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
          <Slider
            name="speedAmt"
            label="Speed"
            hint={speedAmt ? `±${speedAmt}% · copy 2 is ${Math.round(preview.speed * 100)}%` : "Off — identical timing"}
            value={speedAmt}
            max={8}
            onChange={setSpeedAmt}
          />
          <Slider
            name="colorAmt"
            label="Light / color"
            hint={colorAmt ? `sat ${preview.saturation.toFixed(2)} · hue ${preview.hue}` : "Off — identical color"}
            value={colorAmt}
            max={20}
            onChange={setColorAmt}
          />
          <Slider
            name="cropAmt"
            label="Crop / zoom"
            hint={cropAmt ? `${preview.crop}% zoom-in on later copies` : "Off — identical frame"}
            value={cropAmt}
            max={12}
            onChange={setCropAmt}
          />
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
          <Row label="Post as">
            <select name="accountId" defaultValue={defaults.accountId} className="field max-w-xs">
              <option value="">Pick later</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </Row>
        </div>
        <p className="mt-5 text-sm text-mute">Copy 2 preview: {preview.label}</p>
        <button
          className="mt-4 rounded-xl bg-sun px-6 py-3 font-semibold text-ink disabled:opacity-40"
          disabled={files < 1}
        >
          Generate {files || ""} video{files === 1 ? "" : "s"}
        </button>
        <p className="mt-3 text-sm text-mute">
          ffmpeg applies these on this machine. Each file becomes a Ready card.
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

function Slider({
  name,
  label,
  hint,
  value,
  max,
  onChange,
}: {
  name: string;
  label: string;
  hint: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="border-t border-line pt-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-sm">{label}</p>
        <p className="text-xs text-mute">{hint}</p>
      </div>
      <input
        name={name}
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-sun"
      />
    </div>
  );
}
