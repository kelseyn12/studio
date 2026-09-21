"use client";

import { useMemo, useState } from "react";
import { outputCount, parseHookLines, plannedMixes, variationFor } from "@/lib/variations";

type Option = { id: string; name: string };

export function BatchSettings({
  batchId,
  name,
  hooks,
  bodies,
  ctas,
  defaults,
  campaigns,
  formats,
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
    mirrorOn: boolean;
    trimOn: boolean;
    hookColorOn: boolean;
    hookLines: string;
    caption: string;
    campaignId: string;
    formatId: string;
    accountId: string;
  };
  campaigns: Option[];
  formats: Array<{ id: string; name: string; campaignId: string }>;
  accounts: Option[];
}) {
  const [allCombos, setAllCombos] = useState(defaults.allCombos);
  const [count, setCount] = useState(defaults.count);
  const [variants, setVariants] = useState(defaults.variants);
  const [speedAmt, setSpeedAmt] = useState(defaults.speedAmt);
  const [colorAmt, setColorAmt] = useState(defaults.colorAmt);
  const [cropAmt, setCropAmt] = useState(defaults.cropAmt);
  const [mirrorOn, setMirrorOn] = useState(defaults.mirrorOn);
  const [trimOn, setTrimOn] = useState(defaults.trimOn);
  const [hookColorOn, setHookColorOn] = useState(defaults.hookColorOn);
  const [hookLines, setHookLines] = useState(defaults.hookLines);
  const [campaignId, setCampaignId] = useState(defaults.campaignId);
  const dealFormats = formats.filter((format) => format.campaignId === campaignId);
  const textCount = useMemo(() => parseHookLines(hookLines).length, [hookLines]);
  const mixes = useMemo(
    () => plannedMixes(hooks, bodies, ctas, allCombos, count),
    [hooks, bodies, ctas, allCombos, count],
  );
  const files = outputCount(mixes, variants) * Math.max(textCount, 1);
  const preview = variationFor(1, { speedAmt, colorAmt, cropAmt, mirrorOn, hookColorOn });

  return (
    <form action={`/api/repurpose/${batchId}/generate`} method="post" className="space-y-6">
      <input type="hidden" name="name" value={name} />
      {allCombos ? <input type="hidden" name="allCombos" value="on" /> : null}
      {mirrorOn ? <input type="hidden" name="mirrorOn" value="on" /> : null}
      {trimOn ? <input type="hidden" name="trimOn" value="on" /> : null}
      {hookColorOn ? <input type="hidden" name="hookColorOn" value="on" /> : null}

      <div className="rounded-card bg-sun px-5 py-4 text-ink">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">This batch will make</p>
        <p className="mt-1 text-2xl font-semibold">
          {hooks} hooks × {bodies} bodies × {ctas} CTAs = {mixes} mixes
          {textCount > 0 ? ` × ${textCount} text hook${textCount === 1 ? "" : "s"}` : ""}
          {variants > 1 ? ` × ${variants} unique copies` : ""} = {files} videos
        </p>
      </div>

      <section className="rounded-card border border-line bg-panel p-5">
        <p className="label">Text hooks · optional</p>
        <p className="mt-2 text-sm text-mute">
          One line per hook. Each line is burned onto the first clip — big, bold, top-center — and multiplies the
          batch. 6 mixes × 4 lines = 24 videos. Leave empty to skip.
        </p>
        <textarea
          name="hookLines"
          value={hookLines}
          onChange={(event) => setHookLines(event.target.value)}
          placeholder={"I quit my 9-5 for this\nNobody talks about this\nPOV: you found the hack"}
          className="field mt-3 min-h-24"
        />
        {textCount > 0 ? (
          <p className="mt-2 text-sm text-mute">
            {textCount} line{textCount === 1 ? "" : "s"} · every mix gets each line once
          </p>
        ) : null}
      </section>

      <section className="rounded-card border border-line bg-panel p-5">
        <p className="label">Caption</p>
        <p className="mt-2 text-sm text-mute">
          Ships with every video in this batch. Leave it empty and videos post with no caption text.
        </p>
        <textarea
          name="caption"
          defaultValue={defaults.caption}
          placeholder="Caption + hashtags for every video in this batch"
          className="field mt-3 min-h-20"
        />
      </section>

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
          <Row label="Different copies of each mix">
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
          <Row label="Mirror later copies">
            <button
              type="button"
              onClick={() => setMirrorOn(!mirrorOn)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${mirrorOn ? "bg-sun text-ink" : "bg-lift text-mute"}`}
            >
              {mirrorOn ? "On" : "Off"}
            </button>
          </Row>
          <Row label="Text color changes per copy">
            <button
              type="button"
              onClick={() => setHookColorOn(!hookColorOn)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${hookColorOn ? "bg-sun text-ink" : "bg-lift text-mute"}`}
            >
              {hookColorOn ? "On" : "Off"}
            </button>
          </Row>
          <Row label="Cut dead air off clip ends">
            <button
              type="button"
              onClick={() => setTrimOn(!trimOn)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${trimOn ? "bg-sun text-ink" : "bg-lift text-mute"}`}
            >
              {trimOn ? "On" : "Off"}
            </button>
          </Row>
          <Row label="Deal">
            <select
              name="campaignId"
              value={campaignId}
              onChange={(event) => setCampaignId(event.target.value)}
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
              <select name="formatId" defaultValue={defaults.formatId} className="field max-w-xs">
                <option value="">No format</option>
                {dealFormats.map((format) => (
                  <option key={format.id} value={format.id}>
                    {format.name}
                  </option>
                ))}
              </select>
            </Row>
          ) : null}
          <Row label="Account">
            <select name="accountId" defaultValue={defaults.accountId} className="field max-w-xs" required>
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
        </div>
        <p className="mt-5 text-sm text-mute">Copy 2 preview: {preview.label}</p>
        <button
          className="mt-4 rounded-xl bg-sun px-6 py-3 font-semibold text-ink disabled:opacity-40"
          disabled={files < 1}
        >
          Generate {files || ""} video{files === 1 ? "" : "s"}
        </button>
        <p className="mt-3 text-sm text-mute">
          Videos build in the background — a progress bar shows here and you can leave the page. When they are done,
          schedule them on Live and Outstand posts at those times.
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
