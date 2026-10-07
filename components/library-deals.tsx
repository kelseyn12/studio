import { LibraryFile } from "@/components/library-file";
import { LibraryFolder } from "@/components/library-folder";
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
          <LibraryFolder
            key={folder.key}
            title={folder.title}
            count={folderCount(folder.still.length, folder.posted.length)}
          >
            {folder.still.length > 0 ? <FileGrid assets={folder.still} /> : null}
            {folder.posted.length > 0 && folder.still.length > 0 ? (
              <LibraryFolder title="Posted" count={String(folder.posted.length)}>
                <FileGrid assets={folder.posted} />
              </LibraryFolder>
            ) : folder.posted.length > 0 ? (
              <FileGrid assets={folder.posted} />
            ) : null}
          </LibraryFolder>
        ))}
      </div>
    </VideoPick>
  );
}
