"use client";

import { useMemo, useState } from "react";
import { BatchTargets, Row, type BatchAccount } from "@/components/batch-targets";
import { TextStylePick } from "@/components/text-style-pick";
import { dealAccounts } from "@/lib/targets";
import { hookLooks, parseTextStyle, type TextStyle } from "@/lib/text-style";
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
  textBurnWorks = true,
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
    captionsOn: boolean;
    textStyle: string;
    hookLines: string;
    caption: string;
    campaignId: string;
    formatId: string;
    accountId: string;
  };
  campaigns: Option[];
  formats: Array<{ id: string; name: string; campaignId: string }>;
  accounts: BatchAccount[];
  textBurnWorks?: boolean;
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
  const [captionsOn, setCaptionsOn] = useState(defaults.captionsOn);
  const [hookLines, setHookLines] = useState(defaults.hookLines);
  const [campaignId, setCampaignId] = useState(defaults.campaignId);
  const [accountId, setAccountId] = useState(defaults.accountId);
  const [textStyle, setTextStyle] = useState<TextStyle>(parseTextStyle(defaults.textStyle));
  const targetNetworks = (() => {
    const fromDeal = dealAccounts(accounts, campaignId);
    if (fromDeal.length > 0) return fromDeal.map((account) => account.network);
    const picked = accounts.find((account) => account.id === accountId);
    return picked ? [picked.network] : [];
  })();
  const textCount = useMemo(() => parseHookLines(hookLines).length, [hookLines]);
  const mixes = useMemo(
    () => plannedMixes(hooks, bodies, ctas, allCombos, count),
    [hooks, bodies, ctas, allCombos, count],
  );
  const files = outputCount(mixes, variants) * Math.max(textCount, 1);
  const looks = textCount > 0 ? hookLooks(textStyle, targetNetworks, true).length : 1;
  const preview = variationFor(1, { speedAmt, colorAmt, cropAmt, mirrorOn, hookColorOn });

  return (
    <form action={`/api/repurpose/${batchId}/generate`} method="post" className="space-y-6">
      <input type="hidden" name="name" value={name} />
      {allCombos ? <input type="hidden" name="allCombos" value="on" /> : null}
      {mirrorOn ? <input type="hidden" name="mirrorOn" value="on" /> : null}
      {trimOn ? <input type="hidden" name="trimOn" value="on" /> : null}
      {hookColorOn ? <input type="hidden" name="hookColorOn" value="on" /> : null}
      {captionsOn ? <input type="hidden" name="captionsOn" value="on" /> : null}

      {textBurnWorks ? null : (
        <p className="rounded-card border border-line bg-panel px-5 py-4 text-sm text-review">
          This computer cannot burn text onto videos (ffmpeg is missing drawtext). Mixes still work. Spoken words and
          text hooks will fail until you run <code>brew install ffmpeg-full</code>.
        </p>
      )}

      <div className="rounded-card bg-sun px-5 py-4 text-ink">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">This batch will make</p>
        <p className="mt-1 text-2xl font-semibold">
          {hooks} hooks × {bodies} bodies × {ctas} CTAs = {mixes} mixes
          {textCount > 0 ? ` × ${textCount} text hook${textCount === 1 ? "" : "s"}` : ""}
          {variants > 1 ? ` × ${variants} unique copies` : ""} = {files} videos
        </p>
        {looks > 1 ? (
          <p className="mt-1 text-sm text-ink/80">
            Each video is built in {looks} looks (Instagram + TikTok text), so {files * looks} files. Each look posts to
            its own accounts.
          </p>
        ) : null}
      </div>

      <section className="rounded-card border border-line bg-panel p-5">
        <p className="label">Text hooks · optional</p>
        <p className="mt-2 text-sm text-mute">
          Lines that go on every mix — each line makes another set of videos. 6 mixes × 4 lines = 24 videos. Leave
          empty and each hook clip keeps the words typed on it above, which do not multiply.
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
        <TextStylePick value={textStyle} onChange={setTextStyle} networks={targetNetworks} />
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
          <Row label="Spoken words on screen">
            <div className="flex items-center gap-3">
              <p className="max-w-56 text-right text-xs text-mute">
                We listen to your clips and burn what you say as big text, phrase by phrase, through the whole video.
              </p>
              <button
                type="button"
                onClick={() => setCaptionsOn(!captionsOn)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${captionsOn ? "bg-sun text-ink" : "bg-lift text-mute"}`}
              >
                {captionsOn ? "On" : "Off"}
              </button>
            </div>
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
          <BatchTargets
            campaigns={campaigns}
            formats={formats}
            accounts={accounts}
            campaignId={campaignId}
            onCampaignChange={setCampaignId}
            formatId={defaults.formatId}
            accountId={accountId}
            onAccountChange={setAccountId}
          />
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
