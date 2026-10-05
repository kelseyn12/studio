import Link from "next/link";
import { redirect } from "next/navigation";
import { BatchOutputs } from "@/components/batch-outputs";
import { MusicVolume } from "@/components/music-volume";
import { BatchSettings } from "@/components/batch-settings";
import { DropZone } from "@/components/drop-zone";
import { Shell } from "@/components/shell";
import { SlotBlock } from "@/components/slot-block";
import { REFERENCE_MAX_BYTES } from "@/lib/files";
import { cardsToPolish } from "@/lib/batch-polish";
import { isRendering } from "@/lib/render-batch";
import { canBurnText } from "@/lib/ffmpeg";
import { parseHookLayout } from "@/lib/hook-layout";
import { LiveRefresh } from "@/components/live-refresh";
import { prisma } from "@/lib/prisma";
import { createBatch, renameBatch, resetBatch } from "../actions";
import { handle } from "@/lib/targets";
import { OPENAI_BILLING_URL, isListenTooBig, isNoCredits } from "@/lib/whisper";

export const maxDuration = 300;

export default async function BatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hook?: string; polish?: string; tuned?: string; mix?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const winningHook = (query.hook || "").trim();
  const [batch, campaigns, accounts, batches, editors, textBurnWorks] = await Promise.all([
    prisma.repurposeBatch.findUnique({
      where: { id },
      include: { clips: true, tracks: true, outputs: true },
    }),
    prisma.campaign.findMany({ orderBy: { name: "asc" }, include: { formats: true } }),
    prisma.socialAccount.findMany({ where: { isActive: true } }),
    prisma.repurposeBatch.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.user.findMany({ where: { role: "EDITOR" }, orderBy: { name: "asc" } }),
    canBurnText(),
  ]);
  if (!batch) redirect("/repurposer");
  const outputCardIds = batch.outputs.map((output) => output.cardId).filter((cardId): cardId is string => Boolean(cardId));
  const outputCards = outputCardIds.length
    ? await prisma.card.findMany({
        where: { id: { in: outputCardIds } },
        select: { id: true, status: true, scheduledAt: true, assets: { select: { id: true, path: true, coverAt: true } } },
      })
    : [];
  const hooks = batch.clips.filter((clip) => clip.slot === "HOOK");
  const bodies = batch.clips.filter((clip) => clip.slot === "DEMO");
  const ctas = batch.clips.filter((clip) => clip.slot === "CTA");
  const hookPos = parseHookLayout(hooks[0]?.hookLayout);
  const listFromHook = {
    headline: hooks[0]?.hookText ?? "",
    x: hookPos?.x ?? 0.5,
    y: hookPos?.y ?? 0.17,
    places: hookPos?.places,
  };
  const look = batch.textStyle === "instagram" ? "instagram" : batch.textStyle === "plain" ? "plain" : "tiktok";

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <form action={renameBatch} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={batch.id} />
            <input
              name="name"
              defaultValue={batch.name}
              aria-label="Batch name"
              className="w-64 bg-transparent text-3xl font-semibold tracking-tight outline-none"
            />
            <button className="rounded-xl border border-line px-3 py-1 text-sm text-mute">Save name</button>
          </form>
          <p className="mt-2 max-w-2xl text-mute">
            Drop openings in Hooks, middles in Bodies, endings in CTAs. Mix settings are under the rows.
          </p>
          {winningHook ? (
            <p className="mt-3 max-w-2xl rounded-card border border-line bg-panel px-4 py-3 text-sm">
              Winner hook to match: {winningHook}
            </p>
          ) : null}
        </div>
        <form action={createBatch} className="flex gap-2">
          <input name="name" placeholder="Name" aria-label="New batch name" className="field w-44" />
          <button className="shrink-0 rounded-xl border border-line px-4 py-2 text-sm">New batch</button>
        </form>
      </div>
      {batches.length > 1 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {batches.map((item) => (
            <Link
              key={item.id}
              href={`/repurposer/${item.id}`}
              className={`rounded-full px-3 py-1 text-sm ${
                item.id === batch.id ? "bg-sun text-ink" : "bg-lift text-mute"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      ) : null}

      {query.mix === "same-take" ? (
        <p className="mt-6 rounded-card border border-line bg-panel px-5 py-4 text-sm text-review">
          The clip in Bodies is the same recording as one of the CTAs. Those videos play that ending twice and skip a
          middle. Put the walkthrough in Bodies, and leave endings only in CTAs.
        </p>
      ) : null}

      <section className="my-8">
        <p className="label">Clips · drop into the right row</p>
        <div className="mt-3 space-y-5">
          <SlotBlock
            id={batch.id}
            slot="HOOK"
            title="Hooks"
            meta={`${hooks.length} options · first clip · one picked per video`}
            hint="Your openings. Words go on the hook. Spoken captions skip this row."
            clips={hooks}
            showHook
            hookText={winningHook}
            look={look}
            listCount={batch.listCount}
            listFromHook={listFromHook}
          />
          <SlotBlock
            id={batch.id}
            slot="DEMO"
            title="Bodies"
            meta={`${bodies.length} options · middle clip · usually one, can be more`}
            hint="Your middles. List points go on Words. Spoken captions land here."
            clips={bodies}
            look={look}
            listCount={batch.listCount}
            listFromHook={listFromHook}
          />
          <SlotBlock
            id={batch.id}
            slot="CTA"
            title="CTAs"
            meta={`${ctas.length} options · last clip · one picked per video`}
            hint="Your endings. Words and Box work like the hook. Spoken captions land here too."
            clips={ctas}
            look={look}
            listCount={batch.listCount}
            listFromHook={listFromHook}
          />
        </div>
      </section>

      <section className="mb-8 rounded-card border border-line bg-panel p-5">
        <p className="label">Music · optional</p>
        <p className="mb-3 text-sm text-mute">
          Each video picks a random track from this list. The slider sets how loud the song is. Your voice stays full,
          and the right side still stays under you. Drop more than one song if you want different music on each video.
          After Generate, Words + music on a video can change that song’s volume and the part that plays.
        </p>
        <DropZone
          action="/api/repurpose/music"
          extra={{ batchId: batch.id }}
          label="Add music"
          accept="audio/*"
          maxBytes={REFERENCE_MAX_BYTES}
          hint="mp3 / wav under 40MB"
        />
        <ul className="mt-3 text-sm text-mute">
          {batch.tracks.length === 0 ? <li>No tracks yet — videos keep only your voice.</li> : null}
          {batch.tracks.map((track) => (
            <li key={track.id}>{track.filename}</li>
          ))}
        </ul>
        <MusicVolume level={batch.musicLevel} form="batch-generate" />
      </section>

      <BatchSettings
        batchId={batch.id}
        name={batch.name}
        hooks={hooks.length}
        bodies={bodies.length}
        ctas={ctas.length}
        defaults={{
          allCombos: batch.allCombos,
          count: batch.count,
          variants: batch.variants,
          speedAmt: batch.speedAmt,
          colorAmt: batch.colorAmt,
          cropAmt: batch.cropAmt,
          mirrorOn: batch.mirrorOn,
          trimOn: batch.trimOn,
          hookColorOn: batch.hookColorOn,
          captionsOn: batch.captionsOn,
          burnText: batch.burnText,
          textStyle: batch.textStyle,
          listCount: batch.listCount,
          hookLines: batch.hookLines,
          caption: batch.caption,
          campaignId: batch.campaignId ?? "",
          formatId: batch.formatId ?? "",
          accountId: batch.accountId ?? "",
          accountIds: batch.accountIds ?? "",
        }}
        textBurnWorks={textBurnWorks}
        campaigns={campaigns.map((campaign) => ({ id: campaign.id, name: campaign.name }))}
        formats={campaigns.flatMap((campaign) =>
          campaign.formats.map((format) => ({ id: format.id, name: format.name, campaignId: campaign.id })),
        )}
        accounts={accounts.map((account) => ({
          id: account.id,
          network: account.network,
          username: account.username,
          isActive: account.isActive,
          campaignId: account.campaignId,
          name: account.nickname
            ? `${account.nickname} · ${handle(account.username)}`
            : `${account.network} · ${handle(account.username)}`,
        }))}
      />

      {isRendering(batch.status) ? (
        <RenderProgress status={batch.status} batchId={batch.id} />
      ) : batch.status === "ready" && batch.outputs.length > 0 ? (
        <p className="mt-6 text-sm text-live">
          All built.{" "}
          <Link href="/calendar?ship=batch" className="underline">
            Schedule them on Live →
          </Link>
        </p>
      ) : batch.status !== "draft" && batch.status !== "ready" ? (
        isNoCredits(batch.status) ? (
          <p className="mt-6 text-sm text-review">
            OpenAI is out of credits. Spoken words on screen need a few cents on that key.{" "}
            <a href={OPENAI_BILLING_URL} className="text-sun underline" target="_blank" rel="noreferrer">
              Add credits
            </a>
            , then Generate again. Or turn Spoken words off and generate without them.
          </p>
        ) : isListenTooBig(batch.status) ? (
          <p className="mt-6 text-sm text-review">
            This clip was just over Whisper’s 25 MB file cap. Generate again — Studio now sends only the voice, not the
            video.
          </p>
        ) : (
          <p className="mt-6 text-sm text-review">{batch.status}</p>
        )
      ) : null}

      <BatchOutputs
        batchId={batch.id}
        outputs={batch.outputs}
        cards={outputCards}
        editors={editors.map((person) => ({ id: person.id, name: person.name, defaultEditor: person.defaultEditor }))}
        canPolish={isRendering(batch.status) ? 0 : cardsToPolish(outputCards).length}
        polish={query.polish}
        tuned={query.tuned}
        clips={batch.clips.map((clip) => ({ id: clip.id, slot: clip.slot, captionsJson: clip.captionsJson }))}
        tracks={batch.tracks.map((track) => ({ id: track.id, filename: track.filename, path: track.path }))}
      />
    </Shell>
  );
}

function RenderProgress({ status, batchId }: { status: string; batchId: string }) {
  const match = status.match(/rendering (\d+)\/(\d+)/);
  const done = match ? Number(match[1]) : 0;
  const total = match ? Math.max(Number(match[2]), 1) : 1;
  const pct = Math.min(100, Math.round((done / total) * 100));
  return (
    <div className="mt-6 rounded-card border border-line bg-panel px-5 py-4">
      <p className="text-sm font-semibold text-sun">
        Building {done} of {total} stories
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-lift">
        <div className="h-full rounded-full bg-sun transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <LiveRefresh message="You can leave this page — the videos keep building. Finished ones appear below." />
        <form action={resetBatch}>
          <input type="hidden" name="id" value={batchId} />
          <button className="text-xs text-mute hover:text-review">Stuck? Reset</button>
        </form>
      </div>
    </div>
  );
}
