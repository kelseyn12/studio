import { getPost, hasOutstand } from "@/lib/outstand";
import { prisma } from "@/lib/prisma";
import { textStyleForNetwork } from "@/lib/text-style";

type AccountResult = {
  status?: string;
  error?: string | null;
  publishedAt?: string | null;
  platformPostId?: string | null;
};

export type JobOutcome = {
  status: "PUBLISHED" | "FAILED" | "QUEUED";
  error: string | null;
  publishedAt: Date | null;
  platformPostId: string | null;
};

/** Turns Outstand's per-app result into a publish job. Pending stays queued. */
export function publishOutcome(row: AccountResult): JobOutcome {
  const status = String(row.status || "").toLowerCase();
  if (status === "published") {
    const publishedAt = row.publishedAt ? new Date(row.publishedAt) : new Date();
    return {
      status: "PUBLISHED",
      error: null,
      publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
      platformPostId: row.platformPostId || null,
    };
  }
  if (status === "failed" || status === "error") {
    return { status: "FAILED", error: shortPlatformError(row.error), publishedAt: null, platformPostId: null };
  }
  return { status: "QUEUED", error: null, publishedAt: null, platformPostId: null };
}

/** A short reason for the Live notice. The raw Outstand string is often a JSON blob. */
export function shortPlatformError(error: string | null | undefined): string {
  const text = (error || "The app rejected the post").replace(/\s+/g, " ").trim();
  if (/quota exceeded/i.test(text)) return "YouTube daily upload limit is used up. It resets overnight.";
  if (/unable to fetch video/i.test(text)) return "Facebook could not download the video file.";
  if (/container processing failed/i.test(text)) return "Instagram could not process the video.";
  return text.slice(0, 240);
}

type RetryJob = {
  id: string;
  cardId: string;
  accountId: string;
  status: string;
  account: { network: string };
};

/**
 * Accounts to send again. Same video file only (IG with FB, or YT alone), and only rows that
 * failed. A TikTok that already published is left alone.
 */
export function retryAccountIds(jobs: RetryJob[], jobId: string): string[] {
  const job = jobs.find((row) => row.id === jobId);
  if (!job || job.status !== "FAILED") return [];
  const look = textStyleForNetwork(job.account.network);
  return jobs
    .filter(
      (row) =>
        row.cardId === job.cardId &&
        row.status === "FAILED" &&
        textStyleForNetwork(row.account.network) === look,
    )
    .map((row) => row.accountId);
}

/**
 * The earliest live stamp once nothing is still waiting. Failed apps do not block Posted.
 */
export function postedAtWhenLive(
  jobs: Array<{ status: string; publishedAt: Date | null }>,
): Date | null {
  if (jobs.some((job) => job.status === "QUEUED")) return null;
  const times = jobs
    .filter((job) => job.status === "PUBLISHED" && job.publishedAt)
    .map((job) => job.publishedAt as Date)
    .sort((a, b) => a.getTime() - b.getTime());
  return times[0] ?? null;
}

/** Reads queued posts from Outstand and marks each app published or failed. */
export async function syncQueuedPublishes(): Promise<void> {
  if (!hasOutstand()) return;
  const jobs = await prisma.publishJob.findMany({
    where: { status: "QUEUED", outstandPostId: { not: null } },
    include: { account: { select: { outstandAccountId: true } } },
  });
  const byPost = new Map<string, typeof jobs>();
  for (const job of jobs) {
    if (!job.outstandPostId) continue;
    const group = byPost.get(job.outstandPostId) ?? [];
    group.push(job);
    byPost.set(job.outstandPostId, group);
  }
  for (const [postId, group] of byPost) {
    try {
      const post = await getPost(postId);
      const rows = post.socialAccounts ?? [];
      for (const job of group) {
        const row = rows.find((item) => item.id === job.account.outstandAccountId);
        if (!row) continue;
        const outcome = publishOutcome(row);
        if (outcome.status === "QUEUED") continue;
        await prisma.publishJob.update({
          where: { id: job.id },
          data: {
            status: outcome.status,
            error: outcome.error,
            publishedAt: outcome.publishedAt,
            platformPostId: outcome.platformPostId,
          },
        });
      }
    } catch {
      /* leave the job queued when Outstand cannot be read */
    }
  }
  const parked = await prisma.card.findMany({
    where: { status: "READY", scheduledAt: { not: null } },
    select: { id: true, publishes: { select: { status: true, publishedAt: true } } },
  });
  for (const card of parked) {
    const postedAt = postedAtWhenLive(card.publishes);
    if (!postedAt) continue;
    await prisma.card.update({
      where: { id: card.id },
      data: { status: "POSTED", postedAt },
    });
  }
}
