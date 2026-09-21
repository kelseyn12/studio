import Link from "next/link";
import { deleteAsset } from "@/app/library/actions";
import { StatusPill } from "@/components/status-pill";
import { formatBytes } from "@/lib/storage";
import type { PipelineStatus } from "@/lib/pipeline";
import { publicFileUrl } from "@/lib/urls";

export function LibraryFile({
  asset,
  liveLabel,
}: {
  asset: {
    id: string;
    kind: string;
    filename: string;
    path: string;
    mime: string;
    size: number;
    publicUrl: string | null;
    card: { id: string; title: string; status: PipelineStatus; campaign: { name: string } | null };
  };
  liveLabel?: string;
}) {
  const href = asset.publicUrl || publicFileUrl(asset.path);
  const audio = asset.mime.startsWith("audio");
  const video = asset.mime.startsWith("video");
  return (
    <article className="rounded-card border border-line bg-panel p-4">
      {video ? (
        <video controls src={href} className="mb-3 aspect-[9/16] max-h-80 w-full rounded-xl bg-ink object-cover" />
      ) : null}
      {audio ? <audio controls src={href} className="mb-3 w-full" /> : null}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{asset.card.title}</p>
          <p className="text-sm text-mute">
            {asset.card.campaign?.name ?? "No deal"} · {asset.filename} · {formatBytes(asset.size)}
          </p>
        </div>
        <StatusPill status={asset.card.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link href={`/cards/${asset.card.id}${liveLabel ? "?step=live" : ""}`} className="text-sm text-sun">
          {liveLabel ?? "Open"}
        </Link>
        <form action={deleteAsset}>
          <input type="hidden" name="id" value={asset.id} />
          <button className="text-sm text-mute">Delete from Studio</button>
        </form>
      </div>
    </article>
  );
}
