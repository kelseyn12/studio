"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queueCard } from "@/lib/publish";

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
  if (!id || Number.isNaN(when.getTime())) return;
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

export async function retryFailedPost(formData: FormData) {
  await requireUser();
  const jobId = String(formData.get("jobId") || "");
  const job = await prisma.publishJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  await prisma.publishJob.delete({ where: { id: jobId } });
  const when =
    job.scheduledAt && job.scheduledAt > new Date()
      ? job.scheduledAt
      : new Date(Date.now() + RETRY_DELAY_MS);
  await queueCard(job.cardId, when, job.accountId);
  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function clearFailedPost(formData: FormData) {
  await requireUser();
  const jobId = String(formData.get("jobId") || "");
  if (!jobId) return;
  await prisma.publishJob.delete({ where: { id: jobId } }).catch(() => {});
  revalidatePath("/calendar");
}
