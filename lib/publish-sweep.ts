import { queueCard } from "@/lib/publish";
import { accountsReadyToRetry, syncQueuedPublishes } from "@/lib/publish-sync";
import { prisma } from "@/lib/prisma";

const RETRY_DELAY_MS = 2 * 60 * 1000;

let running = false;

/** After a scheduled time, send again only the apps that failed. One pass at a time. */
export async function sweepFailedPublishes(): Promise<void> {
  if (running) return;
  running = true;
  try {
    await syncQueuedPublishes();
    const jobs = await prisma.publishJob.findMany({
      where: { status: { in: ["FAILED", "QUEUED", "PUBLISHED"] } },
      select: { cardId: true, accountId: true, status: true, error: true, createdAt: true, scheduledAt: true },
    });
    const now = new Date();
    for (const group of accountsReadyToRetry(jobs, now)) {
      const future = jobs
        .filter((job) => job.cardId === group.cardId && group.accountIds.includes(job.accountId) && job.scheduledAt && job.scheduledAt > now)
        .map((job) => job.scheduledAt as Date)
        .sort((left, right) => left.getTime() - right.getTime())[0];
      await queueCard(group.cardId, future ?? new Date(now.getTime() + RETRY_DELAY_MS), group.accountIds);
    }
  } catch {
    /* the next pass will try again */
  } finally {
    running = false;
  }
}
