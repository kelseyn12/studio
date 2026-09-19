import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipTile } from "@/components/clip-tile";
import { DropZone } from "@/components/drop-zone";
import { Shell } from "@/components/shell";
import { publicFileUrl } from "@/lib/urls";
import { prisma } from "@/lib/prisma";
import { saveBatch } from "../actions";

export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [batch, campaigns, accounts] = await Promise.all([
    prisma.repurposeBatch.findUnique({
      where: { id },
      include: { clips: true, tracks: true, outputs: { include: {} } },
    }),
    prisma.campaign.findMany({ orderBy: { name: "asc" } }),
    prisma.socialAccount.findMany({ where: { isActive: true } }),
  ]);
  if (!batch) notFound();
  const hooks = batch.clips.filter((clip) => clip.slot === "HOOK");
  const demos = batch.clips.filter((clip) => clip.slot === "DEMO");
  const ctas = batch.clips.filter((clip) => clip.slot === "CTA");
  const possible =
    Math.max(hooks.length, 1) * Math.max(demos.length, 1) * Math.max(ctas.length, 1) *
    (hooks.length || demos.length || ctas.length ? 1 : 0);

  return (
    <Shell>
      <p className="text-sm text-mute">
        <Link href="/repurposer">Repurpose</Link>
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{batch.name}</h1>
      <p className="mt-2 mb-8 text-mute">
        {hooks.length} hooks × {demos.length} demos × {ctas.length} CTAs = {possible} unique videos.
        Empty slots are skipped.
      </p>

      <div className="mb-8 space-y-6">
        <SlotBlock id={batch.id} slot="HOOK" title="Hooks" hint="First clip. One picked per video. Add on-screen text if you want." clips={hooks} showHook />
        <SlotBlock id={batch.id} slot="DEMO" title="Demo" hint="Middle clip. Keep the plug the same; vary the hook." clips={demos} />
        <SlotBlock id={batch.id} slot="CTA" title="CTAs" hint="Close. Film a few endings without rebuilding the scene." clips={ctas} />
      </div>

      <section className="mb-8 rounded-card border border-line bg-panel p-5">
        <p className="label">Music · optional</p>
        <p className="mb-3 text-sm text-mute">Mixed under the original audio. Original stays loud.</p>
        <DropZone action="/api/repurpose/music" extra={{ batchId: batch.id }} label="Add tracks" accept="audio/*" />
        <ul className="mt-3 text-sm text-mute">
          {batch.tracks.map((track) => (
            <li key={track.id}>{track.filename}</li>
          ))}
        </ul>
      </section>

      <form action={saveBatch} className="mb-8 grid gap-4 rounded-card border border-line bg-panel p-5 md:grid-cols-2">
        <input type="hidden" name="id" value={batch.id} />
        <label>
          <span className="label">Name</span>
          <input name="name" defaultValue={batch.name} className="field" />
        </label>
        <label>
          <span className="label">Cap if not all combos</span>
          <input name="count" type="number" defaultValue={batch.count} className="field" />
        </label>
        <label>
          <span className="label">Deal</span>
          <select name="campaignId" defaultValue={batch.campaignId ?? ""} className="field">
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
          <select name="accountId" defaultValue={batch.accountId ?? ""} className="field">
            <option value="">None</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                @{account.username}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="allCombos" defaultChecked={batch.allCombos} /> All combinations
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="speedOn" defaultChecked={batch.speedOn} /> Speed variation
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="colorOn" defaultChecked={batch.colorOn} /> Color variation
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="zoomOn" defaultChecked={batch.zoomOn} /> Zoom / crop jitter
        </label>
        <label>
          <span className="label">Intensity</span>
          <select name="intensity" defaultValue={batch.intensity} className="field">
            <option value="light">Light</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <button className="rounded-xl border border-line px-4 py-2 md:col-span-2">Save settings</button>
      </form>

      <form action={`/api/repurpose/${batch.id}/generate`} method="post" className="mb-10">
        <button className="rounded-xl bg-sun px-6 py-3 font-semibold text-ink">
          Generate videos and make ready cards
        </button>
        <p className="mt-2 text-sm text-mute">Each output lands in Library + Calendar as Ready. Then bulk-space the week.</p>
      </form>

      {batch.status !== "draft" && batch.status !== "ready" && batch.status !== "rendering" ? (
        <p className="mb-6 text-sm text-review">{batch.status}</p>
      ) : null}

      <div className="space-y-2">
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
    <section className="rounded-card border border-line bg-panel p-5">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-mute">{hint}</p>
        </div>
      </div>
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
    </section>
  );
}
