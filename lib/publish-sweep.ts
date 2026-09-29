import { queueCard } from "@/lib/publish";
import { accountsReadyToRetry, retryAt, syncQueuedPublishes } from "@/lib/publish-sync";
import { prisma } from "@/lib/prisma";

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
      await queueCard(group.cardId, retryAt(jobs, group.cardId, group.accountIds, now), group.accountIds);
    }
  } catch {
    /* the next pass will try again */
  } finally {
    running = false;
  }
}
