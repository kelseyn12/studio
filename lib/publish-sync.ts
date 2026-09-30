import { labelTime } from "@/lib/dates";
import { getPost, hasOutstand } from "@/lib/outstand";
import { prisma } from "@/lib/prisma";
import { textStyleForNetwork } from "@/lib/text-style";

const NETWORK_LABEL: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

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

type Attempt = {
  cardId: string;
  accountId: string;
  status: string;
  error: string | null;
  createdAt: Date;
};

function isUploadQuota(error: string | null): boolean {
  return /daily upload limit/i.test(error || "");
}

const QUOTA_RESET_ZONE = "America/Los_Angeles";
const QUOTA_GRACE_MINUTES = 15;

function zoneOffsetMinutes(timeZone: string, instant: Date): number {
  const name =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" })
      .formatToParts(instant)
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT-7";
  const match = /GMT([+-])(\d+)(?::(\d+))?/.exec(name);
  if (!match) return 7 * 60;
  const sign = match[1] === "-" ? 1 : -1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

/** 12:15 AM Pacific on the calendar day after `now`. That is when YouTube's upload cap resets. */
export function nextUploadWindow(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: QUOTA_RESET_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const localQuarterUtc = Date.UTC(year, month - 1, day + 1, 0, QUOTA_GRACE_MINUTES, 0);
  return new Date(localQuarterUtc + zoneOffsetMinutes(QUOTA_RESET_ZONE, new Date(localQuarterUtc)) * 60 * 1000);
}

/**
 * An app that is still queued after the others already posted. The clock is when that app will go out.
 */
export function heldNote(
  jobs: Array<{ status: string; scheduledAt: Date | null; network: string }>,
  liveAt: Date | null,
): string {
  if (!liveAt) return "";
  const waiting = jobs.filter(
    (job) => job.status === "QUEUED" && job.scheduledAt && job.scheduledAt.getTime() > liveAt.getTime() + 60_000,
  );
  if (waiting.length === 0) return "";
  const names = [...new Set(waiting.map((job) => NETWORK_LABEL[job.network] ?? job.network))];
  const when = [...waiting].sort((left, right) => (left.scheduledAt as Date).getTime() - (right.scheduledAt as Date).getTime())[0];
  return `${names.join(" · ")} sends at ${labelTime(when.scheduledAt as Date)}`;
}

/** Apps that rejected the post. Shown on the day so a miss is not a blank time slot. */
export function missedNote(jobs: Array<{ status: string; network: string }>): string {
  const names = [
    ...new Set(jobs.filter((job) => job.status === "FAILED").map((job) => NETWORK_LABEL[job.network] ?? job.network)),
  ];
  if (names.length === 0) return "";
  return `${names.join(" · ")} did not post`;
}

/**
 * When to send a failed app again. YouTube's cap is scheduled for 12:15 AM Pacific.
 * If that reset already passed, it sends in two minutes. Anything else keeps a future time, or sends in two minutes.
 */
export function retryAt(
  jobs: Array<Attempt & { scheduledAt?: Date | null }>,
  cardId: string,
  accountIds: string[],
  now = new Date(),
): Date {
  const related = jobs.filter((job) => job.cardId === cardId && accountIds.includes(job.accountId));
  const latest = [...related].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];
  if (latest && isUploadQuota(latest.error)) {
    const window = nextUploadWindow(latest.createdAt);
    if (window.getTime() > now.getTime() + 60_000) return window;
    return new Date(now.getTime() + 2 * 60 * 1000);
  }
  const future = related
    .map((job) => job.scheduledAt)
    .filter((when): when is Date => Boolean(when && when > now))
    .sort((left, right) => left.getTime() - right.getTime())[0];
  return future ?? new Date(now.getTime() + 2 * 60 * 1000);
}

/**
 * Apps to send again after a failure. A published app is left alone.
 * YouTube's daily cap is not sent again on its own. Anything else gets one automatic retry.
 */
export function accountsReadyToRetry(jobs: Attempt[], now = new Date()): Array<{ cardId: string; accountIds: string[] }> {
  const grouped = new Map<string, Attempt[]>();
  for (const job of jobs) {
    const key = `${job.cardId}:${job.accountId}`;
    const list = grouped.get(key) ?? [];
    list.push(job);
    grouped.set(key, list);
  }
  const chosen = new Map<string, string[]>();
  for (const list of grouped.values()) {
    const latest = [...list].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];
    if (latest.status !== "FAILED") continue;
    if (isUploadQuota(latest.error)) continue;
    const failures = list.filter((job) => job.status === "FAILED").length;
    if (failures > 1) continue;
    const ids = chosen.get(latest.cardId) ?? [];
    ids.push(latest.accountId);
    chosen.set(latest.cardId, ids);
  }
  return [...chosen.entries()].map(([cardId, accountIds]) => ({ cardId, accountIds }));
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
