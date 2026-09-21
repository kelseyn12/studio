import Link from "next/link";
import { clearFailedPost, retryFailedPost } from "@/app/calendar/actions";

export function FailedPosts({
  jobs,
}: {
  jobs: Array<{
    id: string;
    error: string | null;
    scheduledAt: Date | null;
    card: { id: string; title: string };
    account: { username: string };
  }>;
}) {
  if (jobs.length === 0) return null;
  return (
    <section className="mb-6 rounded-card border border-line bg-panel p-5">
      <h2 className="text-lg font-semibold">
        {jobs.length} did not post
      </h2>
      <p className="mt-1 text-sm text-mute">
        Outstand did not take these. Fix the reason (account, file), then Try again.
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
                @{job.account.username}
                {job.error ? ` · ${job.error}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <form action={retryFailedPost}>
                <input type="hidden" name="jobId" value={job.id} />
                <button className="rounded-xl bg-sun px-3 py-1.5 text-sm font-semibold text-ink">Try again</button>
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
