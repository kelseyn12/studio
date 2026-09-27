"use client";

import { useMemo, useState } from "react";
import { Slider, Toggle } from "@/components/batch-controls";
import { BatchTargets, Row, type BatchAccount } from "@/components/batch-targets";
import { TextStylePick } from "@/components/text-style-pick";
import { dealAccounts, parseAccountIds } from "@/lib/targets";
import { hookLooks, parseTextStyle, type TextStyle } from "@/lib/text-style";
import { LIST_MAX, outputCount, parseHookLines, plannedMixes, variationFor } from "@/lib/variations";

type Option = { id: string; name: string };

const LIST_CHOICES = [0, 3, 4, 5, 6, 7, 8, 10].filter((count) => count <= LIST_MAX);

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
    listCount: number;
    textStyle: string;
    hookLines: string;
    caption: string;
    campaignId: string;
    formatId: string;
    accountId: string;
    accountIds: string;
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
  const [listCount, setListCount] = useState(defaults.listCount);
  const [hookLines, setHookLines] = useState(defaults.hookLines);
  const [campaignId, setCampaignId] = useState(defaults.campaignId);
  const [accountIds, setAccountIds] = useState(() => {
    const saved = parseAccountIds(defaults.accountIds);
    return saved.length ? saved : parseAccountIds(defaults.accountId);
  });
  const [textStyle, setTextStyle] = useState<TextStyle>(parseTextStyle(defaults.textStyle));
  const targetNetworks = (() => {
    const fromDeal = dealAccounts(accounts, campaignId);
    if (fromDeal.length > 0) return fromDeal.map((account) => account.network);
    return accounts.filter((account) => accountIds.includes(account.id)).map((account) => account.network);
  })();
  const textCount = useMemo(() => parseHookLines(hookLines).length, [hookLines]);
  const mixes = useMemo(
    () => plannedMixes(hooks, bodies, ctas, allCombos, count),
    [hooks, bodies, ctas, allCombos, count],
  );
  const files = outputCount(mixes, variants) * Math.max(textCount, 1);
  const looks = textCount > 0 ? hookLooks(textStyle, targetNetworks, true).length : 1;
  const copy1 = variationFor(0, { speedAmt, colorAmt, cropAmt, mirrorOn, hookColorOn });
  const preview = variationFor(1, { speedAmt, colorAmt, cropAmt, mirrorOn, hookColorOn });

  return (
    <form action={`/api/repurpose/${batchId}/generate`} method="post" className="space-y-6">
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="listCount" value={listCount} />

      {textBurnWorks ? null : (
        <p className="rounded-card border border-line bg-panel px-5 py-4 text-sm text-review">
          This computer cannot put text on videos (ffmpeg is missing drawtext or libass). Mixes still work. Spoken
          words and text hooks will fail until you run <code>brew install ffmpeg-full</code>.
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
          placeholder={"*WORST* birthday months\nNobody talks about this\nPOV: you found the *hack*"}
          className="field mt-3 min-h-24"
        />
        <p className="mt-2 text-sm text-mute">
          Put *stars* around one word to color it, like Sasha&apos;s green WORST. The rest stays white.
          {textCount > 0 ? ` · ${textCount} line${textCount === 1 ? "" : "s"}, every mix gets each line once.` : ""}
        </p>
        <TextStylePick value={textStyle} onChange={setTextStyle} networks={targetNetworks} />
        <div className="mt-4 border-t border-line pt-4">
          <Row label="Numbered list under the headline">
            <div className="flex items-center gap-3">
              <p className="max-w-56 text-right text-xs text-mute">
                1. 2. 3. down the left side, ready for the points you say out loud.
              </p>
              <select
                value={listCount}
                onChange={(event) => setListCount(Number(event.target.value))}
                className="field max-w-28"
              >
                {LIST_CHOICES.map((choice) => (
                  <option key={choice} value={choice}>
                    {choice === 0 ? "None" : `1–${choice}`}
                  </option>
                ))}
              </select>
            </div>
          </Row>
        </div>
      </section>

      <section className="rounded-card border border-line bg-panel p-5">
        <p className="label">Default caption</p>
        <p className="mt-2 text-sm text-mute">
          Used only when a hook has no caption of its own. Different hooks should get different captions — type those on
          the hook clips above.
        </p>
        <textarea
          name="caption"
          defaultValue={defaults.caption}
          placeholder="Fallback caption + hashtags if a hook is blank"
          className="field mt-3 min-h-20"
        />
      </section>

      <section className="rounded-card border border-line bg-panel p-5">
        <p className="label">Mix settings</p>
        <p className="mt-2 text-sm text-mute">
          A mix is one hook + body + CTA — a different story. Copies are the same story with a slightly different
          speed, light, and crop so the apps do not treat them as the same file. Both looks is the same copy twice:
          Instagram text and TikTok text — same speed and crop on purpose.
        </p>
        <div className="mt-5 space-y-4">
          <Row label="Use every mix">
            <Toggle name="allCombos" on={allCombos} onChange={setAllCombos} />
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
          <Row label="Copies of each mix (same clips, different file)">
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
            hint={
              speedAmt
                ? `copy 1 is ${Math.round(copy1.speed * 100)}% · copy 2 is ${Math.round(preview.speed * 100)}%`
                : "Off — copies keep the same timing"
            }
            value={speedAmt}
            max={8}
            onChange={setSpeedAmt}
          />
          <Slider
            name="colorAmt"
            label="Light / color"
            hint={
              colorAmt
                ? `copy 2 sat ${preview.saturation.toFixed(2)} · hue ${preview.hue} — a nudge, not a wash`
                : "Off — copies keep the same color"
            }
            value={colorAmt}
            max={20}
            onChange={setColorAmt}
          />
          <Slider
            name="cropAmt"
            label="Crop / zoom"
            hint={
              cropAmt
                ? `copy 1 zooms ${copy1.crop}% · copy 2 zooms ${preview.crop}%`
                : "Off — copies keep the same frame"
            }
            value={cropAmt}
            max={12}
            onChange={setCropAmt}
          />
          <Row label="Mirror later copies">
            <Toggle name="mirrorOn" on={mirrorOn} onChange={setMirrorOn} />
          </Row>
          <Row label="Spoken words on screen">
            <div className="flex items-center gap-3">
              <p className="max-w-56 text-right text-xs text-mute">
                What you say, phrase by phrase, in that file&apos;s look — TikTok text or Instagram text.
              </p>
              <Toggle name="captionsOn" on={captionsOn} onChange={setCaptionsOn} />
            </div>
          </Row>
          <Row label="Text color changes per copy">
            <div className="flex items-center gap-3">
              <p className="max-w-56 text-right text-xs text-mute">
                Starred word cycles green, red, yellow, blue. Lines without stars change color as a whole.
              </p>
              <Toggle name="hookColorOn" on={hookColorOn} onChange={setHookColorOn} />
            </div>
          </Row>
          <Row label="Cut dead air off clip ends">
            <Toggle name="trimOn" on={trimOn} onChange={setTrimOn} />
          </Row>
          <BatchTargets
            campaigns={campaigns}
            formats={formats}
            accounts={accounts}
            campaignId={campaignId}
            onCampaignChange={setCampaignId}
            formatId={defaults.formatId}
            accountIds={accountIds}
            onAccountIdsChange={setAccountIds}
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
