import Link from "next/link";
import { notFound } from "next/navigation";
import { BatchSettings } from "@/components/batch-settings";
import { ClipTile } from "@/components/clip-tile";
import { DropZone } from "@/components/drop-zone";
import { Shell } from "@/components/shell";
import { publicFileUrl } from "@/lib/urls";
import { prisma } from "@/lib/prisma";

export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [batch, campaigns, accounts] = await Promise.all([
    prisma.repurposeBatch.findUnique({
      where: { id },
      include: { clips: true, tracks: true, outputs: true },
    }),
    prisma.campaign.findMany({ orderBy: { name: "asc" } }),
    prisma.socialAccount.findMany({ where: { isActive: true } }),
  ]);
  if (!batch) notFound();
  const hooks = batch.clips.filter((clip) => clip.slot === "HOOK");
  const bodies = batch.clips.filter((clip) => clip.slot === "DEMO");
  const ctas = batch.clips.filter((clip) => clip.slot === "CTA");

  return (
    <Shell>
      <p className="text-sm text-mute">
        <Link href="/repurposer">Repurpose</Link>
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{batch.name}</h1>
      <p className="mt-2 max-w-2xl text-mute">
        Two jobs. First, mix clips into different videos. Then make extra copies of each mix with
        slightly different speed, light, and crop so the platform does not treat them as the same file.
      </p>

      <section className="my-8">
        <p className="label">Step 1 · Drop clips</p>
        <div className="mt-3 space-y-5">
          <SlotBlock id={batch.id} slot="HOOK" title="Hooks" hint="Openings. One hook per video." clips={hooks} showHook />
          <SlotBlock id={batch.id} slot="DEMO" title="Bodies" hint="Middle / product. Same body can sit under many hooks." clips={bodies} />
          <SlotBlock id={batch.id} slot="CTA" title="CTAs" hint="Endings. Film a few closes without rebuilding the scene." clips={ctas} />
        </div>
      </section>

      <section className="mb-8 rounded-card border border-line bg-panel p-5">
        <p className="label">Music · optional</p>
        <p className="mb-3 text-sm text-mute">Sits under the original voice. Voice stays loud.</p>
        <DropZone action="/api/repurpose/music" extra={{ batchId: batch.id }} label="Add tracks" accept="audio/*" />
        <ul className="mt-3 text-sm text-mute">
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
          speedOn: batch.speedOn,
          colorOn: batch.colorOn,
          zoomOn: batch.zoomOn,
          intensity: batch.intensity,
          campaignId: batch.campaignId ?? "",
          accountId: batch.accountId ?? "",
        }}
        campaigns={campaigns.map((campaign) => ({ id: campaign.id, name: campaign.name }))}
        accounts={accounts.map((account) => ({ id: account.id, name: `@${account.username}` }))}
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
                Open card
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
  hint,
  clips,
  showHook,
}: {
  id: string;
  slot: string;
  title: string;
  hint: string;
  showHook?: boolean;
  clips: Array<{ id: string; filename: string; thumbPath: string; hookText: string }>;
}) {
  return (
    <div className="rounded-card border border-line bg-panel p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mb-3 text-sm text-mute">{hint}</p>
      <div className="mb-4 flex gap-3 overflow-x-auto pb-2">
        {clips.map((clip) => (
          <ClipTile key={clip.id} {...clip} showHook={Boolean(showHook)} />
        ))}
      </div>
      <DropZone
        action="/api/repurpose/clips"
        extra={{ batchId: id, slot }}
        label={`Add ${title.toLowerCase()}`}
        accept="video/*"
      />
    </div>
  );
}
