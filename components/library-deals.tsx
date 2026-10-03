import { LibraryFile } from "@/components/library-file";
import { PickBox, SelectDeleteBar, VideoPick } from "@/components/select-videos";
import { folderCount, groupLibrary, libraryAction } from "@/lib/library-groups";
import type { PipelineStatus } from "@/lib/pipeline";

type FinishedAsset = {
  id: string;
  kind: string;
  filename: string;
  path: string;
  mime: string;
  size: number;
  textStyle?: string;
  publicUrl: string | null;
  coverPath?: string;
  batch?: string;
  card: {
    id: string;
    title: string;
    status: PipelineStatus;
    scheduledAt: Date | null;
    campaign: { name: string } | null;
  };
};

function FileGrid({ assets }: { assets: FinishedAsset[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {assets.map((asset) => (
        <LibraryFile
          key={asset.id}
          asset={asset}
          pick={<PickBox id={asset.card.id} />}
          liveLabel={libraryAction(asset.card.status, asset.card.scheduledAt)}
        />
      ))}
    </div>
  );
}

export function LibraryDeals({ assets }: { assets: FinishedAsset[] }) {
  if (assets.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-line px-5 py-10 text-mute">
        Nothing finished yet. Generate a batch or drop a finished export.
      </p>
    );
  }
  const videoIds = assets.map((asset) => asset.card.id);
  return (
    <VideoPick ids={videoIds}>
      <div className="space-y-8">
        <SelectDeleteBar total={new Set(videoIds).size} />
        {groupLibrary(assets).map((folder) => (
          <div key={folder.key}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-mute">
              {folder.title} · {folderCount(folder.still.length, folder.posted.length)}
            </h3>
            <div className="space-y-4">
              {folder.still.length > 0 && folder.posted.length > 0 ? (
                <p className="text-sm text-mute">Still to do</p>
              ) : null}
              {folder.still.length > 0 ? <FileGrid assets={folder.still} /> : null}
              {folder.posted.length > 0 && folder.still.length > 0 ? (
                <p className="text-sm text-mute">Posted</p>
              ) : null}
              {folder.posted.length > 0 ? <FileGrid assets={folder.posted} /> : null}
            </div>
          </div>
        ))}
      </div>
    </VideoPick>
  );
}
