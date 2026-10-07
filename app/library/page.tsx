import { deletePostedRaws, freeSpace } from "@/app/library/actions";
import { KEEP_FILE_DAYS } from "@/lib/keep";
import { LibraryDeals } from "@/components/library-deals";
import { LibraryFile } from "@/components/library-file";
import { LibraryFolder } from "@/components/library-folder";
import { Shell } from "@/components/shell";
import { StorageMeter } from "@/components/storage-meter";
import { hasR2 } from "@/lib/r2";
import { groupByDeal } from "@/lib/library-groups";
import { prisma } from "@/lib/prisma";
import { studioBytes } from "@/lib/queries";

function AssetFolders({
  assets,
  empty,
}: {
  assets: Array<{ id: string; card: { campaign: { name: string } | null } } & Parameters<typeof LibraryFile>[0]["asset"]>;
  empty: string;
}) {
  if (assets.length === 0) {
    return <p className="rounded-card border border-dashed border-line px-5 py-8 text-mute">{empty}</p>;
  }
  return (
    <div className="space-y-3">
      {groupByDeal(assets).map((group) => (
        <LibraryFolder key={group.deal} title={group.deal} count={String(group.items.length)}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.items.map((asset) => (
              <LibraryFile key={asset.id} asset={asset} />
            ))}
          </div>
        </LibraryFolder>
      ))}
    </div>
  );
}

export default async function LibraryPage() {
  const [assets, batches, drive, totals] = await Promise.all([
    prisma.asset.findMany({
      include: { card: { include: { campaign: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.repurposeOut.findMany({
      where: { cardId: { not: null } },
      select: { cardId: true, batch: { select: { name: true } } },
    }),
    prisma.card.findMany({
      where: { rawsUrl: { not: "" } },
      include: { campaign: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    studioBytes(),
  ]);
  const batchByCard = new Map(batches.flatMap((row) => (row.cardId ? [[row.cardId, row.batch.name] as const] : [])));
  const finished = assets
    .filter((asset) => asset.kind === "EDITED" || asset.kind === "GENERATED")
    .map((asset) => ({ ...asset, batch: batchByCard.get(asset.card.id) ?? "" }));
  const raws = assets.filter((asset) => asset.kind === "RAW");
  const voice = assets.filter((asset) => asset.kind === "VOICE" || asset.kind === "REFERENCE");
  const postedRaws = raws.filter((asset) => asset.card.status === "POSTED" || asset.card.status === "DATA");

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Library</h1>
      <p className="mt-2 mb-6 max-w-2xl text-mute">
        Canvas videos sit in the Multiply batch. UGC videos sit in the deal, like Trybe. Personal videos sit in
        Personal. Open a folder to see them. Posted stays closed. Posted files drop after {KEEP_FILE_DAYS} days — the
        video and its numbers stay. 4K days stay in Drive.
      </p>
      <div className="mb-8 max-w-xl space-y-3">
        <StorageMeter bytes={totals} r2={hasR2()} />
        <form action={freeSpace}>
          <button className="rounded-xl border border-line px-4 py-2 text-sm">
            Free space — drop posted files older than {KEEP_FILE_DAYS} days
          </button>
        </form>
      </div>
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Finished</h2>
        <LibraryDeals assets={finished} />
      </section>
      <section className="mb-10">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Clips in Studio</h2>
          {postedRaws.length > 0 ? (
            <form action={deletePostedRaws}>
              <button className="rounded-xl border border-line px-4 py-2 text-sm">
                Delete clips on posted videos ({postedRaws.length})
              </button>
            </form>
          ) : null}
        </div>
        <p className="mb-3 text-sm text-mute">Small clips you uploaded onto a video. Delete if you will not reuse them.</p>
        <AssetFolders assets={raws} empty="No small clips in Studio. 4K folders are listed below." />
      </section>
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Voice and references</h2>
        <AssetFolders assets={voice} empty="None in Studio." />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">4K in Drive</h2>
        <p className="mb-3 text-sm text-mute">Not in the 10 GB. The old cut can stay here. Delete it in Drive when you do not need it.</p>
        <div className="space-y-3">
          {drive.length === 0 ? (
            <p className="rounded-card border border-dashed border-line px-5 py-8 text-mute">No Drive folders linked.</p>
          ) : (
            groupByDeal(drive.map((video) => ({ ...video, card: { campaign: video.campaign } }))).map((group) => (
              <LibraryFolder key={group.deal} title={group.deal} count={String(group.items.length)}>
                <div className="space-y-2">
                  {group.items.map((video) => (
                    <div key={video.id} className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium">{video.title}</p>
                      <a href={video.rawsUrl} target="_blank" rel="noreferrer" className="text-sm text-sun">
                        Open folder
                      </a>
                    </div>
                  ))}
                </div>
              </LibraryFolder>
            ))
          )}
        </div>
      </section>
    </Shell>
  );
}
