import type { ReactNode } from "react";
import Link from "next/link";
import { deleteAsset } from "@/app/library/actions";
import { StatusPill } from "@/components/status-pill";
import { formatBytes } from "@/lib/storage";
import type { PipelineStatus } from "@/lib/pipeline";
import { watchUrl } from "@/lib/urls";
import { homeLabel } from "@/lib/video-home";

export function LibraryFile({
  asset,
  liveLabel,
  pick,
}: {
  asset: {
    id: string;
    kind: string;
    filename: string;
    path: string;
    mime: string;
    size: number;
    textStyle?: string;
    publicUrl: string | null;
    coverPath?: string;
    card: {
      id: string;
      title: string;
      status: PipelineStatus;
      scheduledAt: Date | null;
      home?: string | null;
      campaign: { name: string } | null;
    };
  };
  liveLabel?: string;
  pick?: ReactNode;
}) {
  const look = asset.textStyle === "instagram" ? "IG · FB" : asset.textStyle === "tiktok" ? "TT · YT" : "";
  const href = watchUrl(asset.path);
  const audio = asset.mime.startsWith("audio");
  const video = asset.mime.startsWith("video");
  return (
    <article className="rounded-card border border-line bg-panel p-4">
      {pick ? <div className="mb-3">{pick}</div> : null}
      {video ? (
        <video
          controls
          preload="none"
          src={href}
          poster={asset.coverPath ? watchUrl(asset.coverPath) : undefined}
          className="mb-3 aspect-[9/16] max-h-80 w-full rounded-xl bg-ink object-cover"
        />
      ) : null}
      {audio ? <audio controls src={href} className="mb-3 w-full" /> : null}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{asset.card.title}</p>
          <p className="text-sm text-mute">
            {homeLabel(asset.card.home, asset.card.campaign?.name)}
            {look ? ` · ${look}` : ""} · {asset.filename} · {formatBytes(asset.size)}
          </p>
        </div>
        <StatusPill status={asset.card.status} scheduledAt={asset.card.scheduledAt} />
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
