"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { youtubeVideoId } from "@/lib/youtube-public";
import { cancelPost } from "@/lib/outstand";
import { prisma } from "@/lib/prisma";
import { queueCard } from "@/lib/publish";
import { retryAccountIds, youtubeRetryAllowed } from "@/lib/publish-sync";
import { timeAlreadyPassed } from "@/lib/dates";
import { canUnschedule, cancelAlreadyGone, postsToCancel } from "@/lib/unschedule";

const RETRY_DELAY_MS = 5 * 60 * 1000;

export async function saveCardAccounts(formData: FormData) {
  await requireUser();
  const id = String(formData.get("cardId") || "");
  if (!id) return;
  const accountIds = formData.getAll("accountIds").map(String).filter(Boolean);
  await prisma.card.update({
    where: { id },
    data: { accountIds: accountIds.join(","), accountId: accountIds[0] || null },
  });
  revalidatePath("/calendar");
  revalidatePath(`/cards/${id}`);
}

export async function parkCard(formData: FormData) {
  await requireUser();
  const id = String(formData.get("cardId") || "");
  const when = new Date(String(formData.get("scheduledAt") || ""));
  if (!id || timeAlreadyPassed(when)) redirect("/calendar?ship=past");
  // Claim the video before the slow upload, so a second click cannot send it twice.
  const claimed = await prisma.card.updateMany({
    where: { id, scheduledAt: null },
    data: { scheduledAt: when },
  });
  if (claimed.count === 0) redirect("/calendar?ship=taken");
  const result = await queueCard(id, when, null);
  revalidatePath("/calendar");
  revalidatePath(`/cards/${id}`);
  if (!result.ok) redirect("/calendar?ship=fail");
}

export async function unscheduleCard(formData: FormData) {
  await requireUser();
  const id = String(formData.get("cardId") || "");
  if (!id) return;
  const card = await prisma.card.findUnique({ where: { id }, include: { publishes: true } });
  if (!card || !canUnschedule(card.status)) return;
  const postIds = postsToCancel(card.publishes);
  for (const postId of postIds) {
    try {
      await cancelPost(postId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!cancelAlreadyGone(message)) redirect("/calendar?view=scheduled&ship=cancel-fail");
    }
  }
  await prisma.publishJob.updateMany({
    where: { cardId: id, status: { in: ["QUEUED", "DRAFT", "FAILED"] } },
    data: { status: "CANCELLED" },
  });
  await prisma.card.update({
    where: { id },
    data: { scheduledAt: null, outstandPostId: null },
  });
  revalidatePath("/calendar");
  revalidatePath(`/cards/${id}`);
  redirect("/calendar?view=scheduled&ship=cleared");
}

export async function retryFailedPost(formData: FormData) {
  await requireUser();
  const jobId = String(formData.get("jobId") || "");
  const failed = await prisma.publishJob.findMany({
    where: { status: "FAILED" },
    include: { account: { select: { network: true } } },
  });
  const job = failed.find((row) => row.id === jobId);
  const accountIds = retryAccountIds(failed, jobId);
  if (!job || accountIds.length === 0) return;
  await prisma.publishJob.deleteMany({
    where: { cardId: job.cardId, status: "FAILED", accountId: { in: accountIds } },
  });
  const when =
    job.scheduledAt && job.scheduledAt > new Date()
      ? job.scheduledAt
      : new Date(Date.now() + RETRY_DELAY_MS);
  await queueCard(job.cardId, when, accountIds);
  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function retryFailedAt(formData: FormData) {
  await requireUser();
  const jobId = String(formData.get("jobId") || "");
  const when = new Date(String(formData.get("scheduledAt") || ""));
  const failed = await prisma.publishJob.findMany({
    where: { status: "FAILED" },
    include: { account: { select: { network: true } } },
  });
  const job = failed.find((row) => row.id === jobId);
  const accountIds = retryAccountIds(failed, jobId);
  if (!job || accountIds.length === 0 || Number.isNaN(when.getTime())) redirect("/calendar?ship=yt-early");
  if (!youtubeRetryAllowed(job.error, when, job.createdAt)) redirect("/calendar?ship=yt-early");
  await prisma.publishJob.deleteMany({
    where: { cardId: job.cardId, status: "FAILED", accountId: { in: accountIds } },
  });
  const result = await queueCard(job.cardId, when, accountIds);
  const stillPosted = await prisma.publishJob.count({
    where: { cardId: job.cardId, status: "PUBLISHED" },
  });
  if (stillPosted > 0) {
    await prisma.card.update({ where: { id: job.cardId }, data: { status: "POSTED" } });
  }
  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath(`/cards/${job.cardId}`);
  if (!result.ok) redirect("/calendar?ship=fail");
  redirect("/calendar?ship=yt-later");
}

export async function clearFailedPost(formData: FormData) {
  await requireUser();
  const jobId = String(formData.get("jobId") || "");
  if (!jobId) return;
  await prisma.publishJob.delete({ where: { id: jobId } }).catch(() => {});
  revalidatePath("/calendar");
}

/** Downloading the YouTube file means that app was posted by hand. Nothing else is sent. */
export async function saveYouTubeLink(formData: FormData) {
  await requireUser();
  const jobId = String(formData.get("jobId") || "");
  const raw = String(formData.get("youtubeUrl") || "").trim();
  if (!jobId) return;
  const job = await prisma.publishJob.findUnique({
    where: { id: jobId },
    include: { account: { select: { network: true } } },
  });
  if (!job || job.account.network !== "youtube") return;
  const videoId = youtubeVideoId(raw);
  if (raw && !videoId) return;
  await prisma.card.update({
    where: { id: job.cardId },
    data: { youtubeUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "" },
  });
  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath("/analytics");
  revalidatePath(`/cards/${job.cardId}`);
}

export async function markYouTubeDownloaded(jobId: string) {
  await requireUser();
  if (!jobId) return;
  const job = await prisma.publishJob.findUnique({
    where: { id: jobId },
    include: { account: { select: { network: true } } },
  });
  if (!job || job.status !== "FAILED" || job.account.network !== "youtube") return;
  await prisma.publishJob.update({
    where: { id: jobId },
    data: { status: "PUBLISHED", error: null, publishedAt: new Date() },
  });
  await prisma.card.update({ where: { id: job.cardId }, data: { status: "POSTED" } });
  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath(`/cards/${job.cardId}`);
}
