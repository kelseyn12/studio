import Link from "next/link";
import { clearFailedPost, retryFailedPost } from "@/app/calendar/actions";
import { ScheduleButton } from "@/components/schedule-button";
import { describeTargets } from "@/lib/targets";

export function FailedPosts({
  jobs,
}: {
  jobs: Array<{
    id: string;
    error: string | null;
    scheduledAt: Date | null;
    card: { id: string; title: string };
    account: { username: string; network: string };
  }>;
}) {
  if (jobs.length === 0) return null;
  return (
    <section className="mb-6 rounded-card border border-line bg-panel p-5">
      <h2 className="text-lg font-semibold">
        {jobs.length} did not post
      </h2>
      <p className="mt-1 text-sm text-mute">
        These apps rejected the post. Try again sends only the ones that failed, so TikTok is not posted a second time.
      </p>
      <div className="mt-4 space-y-2">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3"
          >
            <div className="min-w-0">
              <Link href={`/cards/${job.card.id}?step=live`} className="font-medium">
                {job.card.title}
              </Link>
              <p className="truncate text-xs text-mute">
                {describeTargets([job.account])}
                {job.error ? ` · ${job.error}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <form action={retryFailedPost}>
                <input type="hidden" name="jobId" value={job.id} />
                <ScheduleButton
                  label="Try again"
                  pendingLabel="Trying…"
                  className="rounded-xl bg-sun px-3 py-1.5 text-sm font-semibold text-ink"
                />
              </form>
              <form action={clearFailedPost}>
                <input type="hidden" name="jobId" value={job.id} />
                <button className="rounded-xl border border-line px-3 py-1.5 text-sm text-mute">Clear</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
