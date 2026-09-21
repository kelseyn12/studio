import { LibraryFile } from "@/components/library-file";
import { groupByDeal } from "@/lib/library-groups";
import type { PipelineStatus } from "@/lib/pipeline";

type FinishedAsset = {
  id: string;
  kind: string;
  filename: string;
  path: string;
  mime: string;
  size: number;
  publicUrl: string | null;
  card: { id: string; title: string; status: PipelineStatus; campaign: { name: string } | null };
};

export function LibraryDeals({ assets }: { assets: FinishedAsset[] }) {
  if (assets.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-line px-5 py-10 text-mute">
        Nothing finished yet. Generate a batch or drop a finished export.
      </p>
    );
  }
  return (
    <div className="space-y-8">
      {groupByDeal(assets).map((group) => (
        <div key={group.deal}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-mute">
            {group.deal} · {group.items.length}
          </h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.items.map((asset) => (
              <LibraryFile
                key={asset.id}
                asset={asset}
                liveLabel={
                  asset.card.status === "REVIEW"
                    ? "Approve / schedule"
                    : asset.card.status === "READY"
                      ? "Schedule"
                      : "Open"
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
