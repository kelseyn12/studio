import { retryFailedAt } from "@/app/calendar/actions";
import { DownloadPosted } from "@/components/download-posted";
import { ScheduleButton } from "@/components/schedule-button";
import { labelTime, toInputDateTime } from "@/lib/dates";
import { nextUploadWindow } from "@/lib/publish-sync";
import { watchUrl } from "@/lib/urls";

/** The TT · YT file, which is the one YouTube uses. */
export function youtubeDownload(
  assets: Array<{ kind: string; textStyle: string; path: string; filename: string; createdAt: Date }>,
): { href: string; filename: string } | null {
  const file = [...assets]
    .filter((asset) => asset.kind === "GENERATED" && asset.textStyle === "tiktok" && asset.path)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];
  if (!file) return null;
  return { href: watchUrl(file.path), filename: file.filename || "youtube.mp4" };
}

/** Download the YouTube file, or send only YouTube after the shared cap refills. */
export function YouTubeMiss({
  jobId,
  failedAt,
  download,
}: {
  jobId: string;
  failedAt: Date;
  download: { href: string; filename: string } | null;
}) {
  const window = nextUploadWindow(failedAt);
  const open = window.getTime() > Date.now() ? window : new Date(Date.now() + 2 * 60 * 1000);
  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-mute">
        {window.getTime() > Date.now()
          ? `Outstand's shared YouTube cap is full until about 2:00 AM. The first time that can work is ${labelTime(window)}. A time before that fails again.`
          : "The YouTube cap has reset. Pick a time and only YouTube is sent."}
      </p>
      {download ? <DownloadPosted jobId={jobId} href={download.href} filename={download.filename} /> : null}
      <form action={retryFailedAt} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="jobId" value={jobId} />
        <label className="text-sm">
          Send only YouTube at
          <input name="scheduledAt" type="datetime-local" defaultValue={toInputDateTime(open)} required className="field mt-1" />
        </label>
        <ScheduleButton
          label="Post YouTube then"
          pendingLabel="Sending…"
          className="rounded-xl bg-sun px-3 py-2 text-sm font-semibold text-ink"
        />
      </form>
    </div>
  );
}
