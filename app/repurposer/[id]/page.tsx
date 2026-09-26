import Link from "next/link";
import { redirect } from "next/navigation";
import { BatchOutputs } from "@/components/batch-outputs";
import { BatchSettings } from "@/components/batch-settings";
import { ClipTile } from "@/components/clip-tile";
import { DropZone } from "@/components/drop-zone";
import { Shell } from "@/components/shell";
import { REFERENCE_MAX_BYTES } from "@/lib/files";
import { STUDIO_FILE_MAX_BYTES } from "@/lib/storage";
import { cardsToPolish } from "@/lib/batch-polish";
import { isRendering } from "@/lib/render-batch";
import { canBurnText } from "@/lib/ffmpeg";
import { LiveRefresh } from "@/components/live-refresh";
import { prisma } from "@/lib/prisma";
import { createBatch, resetBatch } from "../actions";

export default async function BatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hook?: string; polish?: string }>;
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
        select: { id: true, status: true, scheduledAt: true },
      })
    : [];
  const hooks = batch.clips.filter((clip) => clip.slot === "HOOK");
  const bodies = batch.clips.filter((clip) => clip.slot === "DEMO");
  const ctas = batch.clips.filter((clip) => clip.slot === "CTA");

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{batch.name}</h1>
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
          <input name="name" placeholder="Another batch" className="field w-44" />
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

      <section className="my-8">
        <p className="label">Clips · drop into the right row</p>
        <div className="mt-3 space-y-5">
          <SlotBlock
            id={batch.id}
            slot="HOOK"
            title="Hooks"
            meta={`${hooks.length} options · first clip · one picked per video`}
            hint="Openings. Drop every hook take here."
            clips={hooks}
            showHook
            hookText={winningHook}
          />
          <SlotBlock
            id={batch.id}
            slot="DEMO"
            title="Bodies"
            meta={`${bodies.length} options · middle clip · usually one, can be more`}
            hint="Product / demo. Same body can sit under many hooks."
            clips={bodies}
          />
          <SlotBlock
            id={batch.id}
            slot="CTA"
            title="CTAs"
            meta={`${ctas.length} options · last clip · one picked per video`}
            hint="Endings. Film a few closes without rebuilding the scene."
            clips={ctas}
          />
        </div>
      </section>

      <section className="mb-8 rounded-card border border-line bg-panel p-5">
        <p className="label">Music · optional</p>
        <p className="mb-3 text-sm text-mute">
          Each video picks a random track from this list. Voice stays loud — music sits under it. Drop more than one
          song if you want different music on each video. One song = every video gets that song.
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
          hookLines: batch.hookLines,
          caption: batch.caption,
          campaignId: batch.campaignId ?? "",
          formatId: batch.formatId ?? "",
          accountId: batch.accountId ?? "",
        }}
        textBurnWorks={textBurnWorks}
        campaigns={campaigns.map((campaign) => ({ id: campaign.id, name: campaign.name }))}
        formats={campaigns.flatMap((campaign) =>
          campaign.formats.map((format) => ({ id: format.id, name: format.name, campaignId: campaign.id })),
        )}
        accounts={accounts.map((account) => ({
          id: account.id,
          name: account.nickname
            ? `${account.nickname} · @${account.username}`
            : `${account.network} · @${account.username}`,
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
        <p className="mt-6 text-sm text-review">{batch.status}</p>
      ) : null}

      <BatchOutputs
        batchId={batch.id}
        outputs={batch.outputs}
        cards={outputCards}
        editors={editors.map((person) => ({ id: person.id, name: person.name, defaultEditor: person.defaultEditor }))}
        canPolish={isRendering(batch.status) ? 0 : cardsToPolish(outputCards).length}
        polish={query.polish}
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
        Building your videos · {done} of {total} done
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

function SlotBlock({
  id,
  slot,
  title,
  meta,
  hint,
  clips,
  showHook,
  hookText,
}: {
  id: string;
  slot: string;
  title: string;
  meta: string;
  hint: string;
  showHook?: boolean;
  hookText?: string;
  clips: Array<{ id: string; filename: string; path: string; thumbPath: string; hookText: string }>;
}) {
  return (
    <div className="rounded-card border border-line bg-panel p-5">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-xs uppercase tracking-[0.12em] text-mute">{meta}</p>
      </div>
      <p className="mb-4 text-sm text-mute">{hint}</p>
      <div className="mb-4 flex gap-3 overflow-x-auto pb-2">
        {clips.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-8 text-sm text-mute">
            Nothing in this row yet.
          </p>
        ) : (
          clips.map((clip) => <ClipTile key={clip.id} {...clip} showHook={Boolean(showHook)} />)
        )}
      </div>
      <DropZone
        action="/api/repurpose/clips"
        extra={{ batchId: id, slot, ...(hookText ? { hookText } : {}) }}
        label={`Add ${title.toLowerCase()}`}
        accept="video/*"
        maxBytes={STUDIO_FILE_MAX_BYTES}
        hint="One take at a time, 4K is fine. Under 250MB (about 90 seconds of 4K)."
      />
    </div>
  );
}
