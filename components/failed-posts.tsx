import Link from "next/link";
import { clearFailedPost, retryFailedPost } from "@/app/calendar/actions";
import { ScheduleButton } from "@/components/schedule-button";
import { youtubeDownload, YouTubeMiss } from "@/components/youtube-miss";
import { postedAppLine } from "@/lib/publish-sync";
import { describeTargets } from "@/lib/targets";

type FailedJob = {
  id: string;
  error: string | null;
  createdAt: Date;
  scheduledAt: Date | null;
  card: {
    id: string;
    title: string;
    youtubeUrl: string;
    assets: Array<{ kind: string; textStyle: string; path: string; filename: string; createdAt: Date }>;
    publishes: Array<{ status: string; account: { network: string } }>;
  };
  account: { username: string; network: string };
};

export function FailedPosts({ jobs }: { jobs: FailedJob[] }) {
  if (jobs.length === 0) return null;
  return (
    <section className="mb-6 rounded-card border border-line bg-panel p-5">
      <h2 className="text-lg font-semibold">Posted, with a miss</h2>
      <p className="mt-1 text-sm text-mute">
        The apps below went out. The one named after them did not. Try again sends only that app.
      </p>
      <div className="mt-4 space-y-3">
        {jobs.map((job) => {
          const posted = postedAppLine(job.card.publishes.map((row) => ({ status: row.status, network: row.account.network })));
          const quota = /daily upload limit/i.test(job.error || "");
          return (
            <div key={job.id} className="rounded-xl border border-line px-4 py-3">
              <Link href={`/cards/${job.card.id}?step=live`} className="font-medium">
                {job.card.title}
              </Link>
              {posted ? <p className="text-sm font-semibold text-live">Posted · {posted}</p> : null}
              <p className="text-sm font-semibold text-sun">
                {describeTargets([job.account])} did not post
              </p>
              {job.error ? <p className="text-xs text-mute">{job.error}</p> : null}
              {quota ? (
                <YouTubeMiss
                  jobId={job.id}
                  failedAt={job.createdAt}
                  download={youtubeDownload(job.card.assets)}
                  youtubeUrl={job.card.youtubeUrl}
                />
              ) : (
                <form action={retryFailedPost} className="mt-3">
                  <input type="hidden" name="jobId" value={job.id} />
                  <ScheduleButton
                    label="Try again"
                    pendingLabel="Trying…"
                    className="rounded-xl bg-sun px-3 py-1.5 text-sm font-semibold text-ink"
                  />
                </form>
              )}
              <form action={clearFailedPost} className="mt-2">
                <input type="hidden" name="jobId" value={job.id} />
                <button className="text-sm text-mute">Clear</button>
              </form>
            </div>
          );
        })}
      </div>
    </section>
  );
}
