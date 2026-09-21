import { deletePostedRaws } from "@/app/library/actions";
import { LibraryDeals } from "@/components/library-deals";
import { LibraryFile } from "@/components/library-file";
import { Shell } from "@/components/shell";
import { StorageMeter } from "@/components/storage-meter";
import { hasR2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { studioBytes } from "@/lib/queries";

export default async function LibraryPage() {
  const [assets, drive, totals] = await Promise.all([
    prisma.asset.findMany({
      include: { card: { include: { campaign: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.card.findMany({
      where: { rawsUrl: { not: "" } },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    studioBytes(),
  ]);
  const finished = assets.filter((asset) => asset.kind === "EDITED" || asset.kind === "GENERATED");
  const raws = assets.filter((asset) => asset.kind === "RAW");
  const voice = assets.filter((asset) => asset.kind === "VOICE" || asset.kind === "REFERENCE");
  const postedRaws = raws.filter((asset) => asset.card.status === "POSTED" || asset.card.status === "DATA");

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Library</h1>
      <p className="mt-2 mb-6 max-w-2xl text-mute">
        Finished videos are grouped by deal. Watch, keep, or delete. 4K days stay in Drive.
      </p>
      <div className="mb-8 max-w-xl">
        <StorageMeter bytes={totals} r2={hasR2()} />
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
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {raws.length === 0 ? (
            <p className="rounded-card border border-dashed border-line px-5 py-8 text-mute md:col-span-2">
              No small clips in Studio. 4K folders are listed below.
            </p>
          ) : (
            raws.map((asset) => <LibraryFile key={asset.id} asset={asset} />)
          )}
        </div>
      </section>
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Voice and references</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {voice.length === 0 ? (
            <p className="rounded-card border border-dashed border-line px-5 py-8 text-mute">None in Studio.</p>
          ) : (
            voice.map((asset) => <LibraryFile key={asset.id} asset={asset} />)
          )}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">4K in Drive</h2>
        <p className="mb-3 text-sm text-mute">Not in the 10 GB. Open the folder to delete or move there.</p>
        <div className="space-y-2">
          {drive.length === 0 ? (
            <p className="rounded-card border border-dashed border-line px-5 py-8 text-mute">No Drive folders linked.</p>
          ) : (
            drive.map((video) => (
              <div
                key={video.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-panel px-5 py-4"
              >
                <p className="font-medium">{video.title}</p>
                <a href={video.rawsUrl} target="_blank" rel="noreferrer" className="text-sm text-sun">
                  Open folder
                </a>
              </div>
            ))
          )}
        </div>
      </section>
    </Shell>
  );
}
