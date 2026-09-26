import Link from "next/link";
import { FREE_R2_BYTES, studioUsage } from "@/lib/storage";

export function StorageMeter({
  bytes,
  r2,
}: {
  bytes: number;
  r2: boolean;
}) {
  const usage = studioUsage(bytes);
  const width = Math.min(100, Math.round((usage.bytes / FREE_R2_BYTES) * 100));
  return (
    <Link
      href="/library"
      className={`block rounded-card border px-5 py-4 ${usage.hot ? "border-sun bg-panel" : "border-line bg-panel"}`}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-mute">
        {r2 ? "Files in the cloud · 10 GB free" : "Files on this Mac until cloud storage is on"}
      </p>
      <p className="mt-2 text-lg font-semibold">
        {usage.label} of {usage.of}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-lift">
        <div className="h-full rounded-full bg-sun" style={{ width: `${width}%` }} />
      </div>
      <p className="mt-2 text-sm text-mute">
        {usage.full
          ? "Over the free 10 GB. Paying for more R2 is fine — or Free space in Library."
          : usage.hot
            ? "Near the free 10 GB. Posted files drop after 14 days, or Free space in Library."
            : "Working files only. Posted videos drop after 14 days. Paying past 10 GB is fine."}
      </p>
    </Link>
  );
}
