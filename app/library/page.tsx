import Link from "next/link";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { publicFileUrl } from "@/lib/urls";
import { prisma } from "@/lib/prisma";

export default async function LibraryPage() {
  const assets = await prisma.asset.findMany({
    where: { kind: { in: ["EDITED", "GENERATED"] } },
    include: { card: { include: { campaign: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Library</h1>
      <p className="mt-2 mb-8 text-mute">
        Finished cuts only. Raws stay in Drive. After Calendar ships, Outstand holds the public file for ~60 days.
      </p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {assets.length === 0 ? (
          <p className="rounded-card border border-dashed border-line px-5 py-10 text-mute md:col-span-2">
            Nothing finished yet. Generate a batch or drop a 1080 on a card.
          </p>
        ) : (
          assets.map((asset) => (
            <article key={asset.id} className="rounded-card border border-line bg-panel p-4">
              <video
                controls
                src={asset.publicUrl || publicFileUrl(asset.path)}
                className="mb-3 aspect-[9/16] max-h-80 w-full rounded-xl bg-ink object-cover"
              />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{asset.card.title}</p>
                  <p className="text-sm text-mute">{asset.card.campaign?.name ?? "No deal"}</p>
                </div>
                <StatusPill status={asset.card.status} />
              </div>
              <Link href={`/cards/${asset.card.id}`} className="mt-3 inline-block text-sm text-sun">
                Open card
              </Link>
            </article>
          ))
        )}
      </div>
    </Shell>
  );
}
