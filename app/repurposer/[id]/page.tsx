import Link from "next/link";
import { notFound } from "next/navigation";
import { BatchSettings } from "@/components/batch-settings";
import { ClipTile } from "@/components/clip-tile";
import { DropZone } from "@/components/drop-zone";
import { Shell } from "@/components/shell";
import { REFERENCE_MAX_BYTES } from "@/lib/files";
import { STUDIO_FILE_MAX_BYTES } from "@/lib/storage";
import { publicFileUrl } from "@/lib/urls";
import { prisma } from "@/lib/prisma";
import { createBatch } from "../actions";

export default async function BatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hook?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const winningHook = (query.hook || "").trim();
  const [batch, campaigns, accounts, batches] = await Promise.all([
    prisma.repurposeBatch.findUnique({
      where: { id },
      include: { clips: true, tracks: true, outputs: true },
    }),
    prisma.campaign.findMany({ orderBy: { name: "asc" } }),
    prisma.socialAccount.findMany({ where: { isActive: true } }),
    prisma.repurposeBatch.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  if (!batch) notFound();
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
          hookLines: batch.hookLines,
          caption: batch.caption,
          campaignId: batch.campaignId ?? "",
          accountId: batch.accountId ?? "",
        }}
        campaigns={campaigns.map((campaign) => ({ id: campaign.id, name: campaign.name }))}
        accounts={accounts.map((account) => ({
          id: account.id,
          name: account.nickname
            ? `${account.nickname} · @${account.username}`
            : `${account.network} · @${account.username}`,
        }))}
      />

      {batch.status === "rendering" ? (
        <p className="mt-6 text-sm text-sun">Rendering. Keep this tab open — ffmpeg is building the files.</p>
      ) : batch.status !== "draft" && batch.status !== "ready" ? (
        <p className="mt-6 text-sm text-review">{batch.status}</p>
      ) : null}

      <div className="mt-8 space-y-2">
        {batch.outputs.map((output) => (
          <div key={output.id} className="flex items-center justify-between rounded-card border border-line bg-panel px-4 py-3">
            <a className="text-sun" href={publicFileUrl(output.path)}>
              {output.label}
            </a>
            {output.cardId ? (
              <Link href={`/cards/${output.cardId}`} className="text-sm text-mute">
                Open video
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </Shell>
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
        hint="Phone clip under 250MB. Not a 4K day."
      />
    </div>
  );
}
