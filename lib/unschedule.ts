/** A posted video stays up. Everything else can come off the calendar. */
export function canUnschedule(status: string): boolean {
  return status !== "POSTED" && status !== "DATA";
}

/** Outstand post ids still waiting to go live. One id can cover several accounts. */
export function postsToCancel(jobs: Array<{ outstandPostId: string | null; status: string }>): string[] {
  const done = new Set(["PUBLISHED", "CANCELLED"]);
  return [
    ...new Set(
      jobs
        .filter((job) => job.outstandPostId && !done.has(job.status))
        .map((job) => job.outstandPostId as string),
    ),
  ];
}

/** Outstand already dropped the post, so a second cancel is fine. */
export function cancelAlreadyGone(message: string): boolean {
  const text = message.toLowerCase();
  return text.includes("not found") || text.includes("404") || text.includes("does not exist");
}
