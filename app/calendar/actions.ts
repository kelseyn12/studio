"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queueCard } from "@/lib/publish";

const RETRY_DELAY_MS = 5 * 60 * 1000;

export async function parkCard(formData: FormData) {
  await requireUser();
  const id = String(formData.get("cardId") || "");
  const when = new Date(String(formData.get("scheduledAt") || ""));
  const accountId = String(formData.get("accountId") || "") || null;
  if (!id || Number.isNaN(when.getTime())) return;
  await queueCard(id, when, accountId);
  revalidatePath("/calendar");
  revalidatePath(`/cards/${id}`);
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
