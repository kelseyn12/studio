"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createBatch(formData: FormData) {
  const batch = await prisma.repurposeBatch.create({
    data: { name: String(formData.get("name") || "New batch") },
  });
  redirect(`/repurposer/${batch.id}`);
}

export async function resetBatch(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.repurposeBatch.update({ where: { id }, data: { status: "draft" } });
  redirect(`/repurposer/${id}`);
}

export async function saveBatch(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.repurposeBatch.update({
    where: { id },
    data: {
      name: String(formData.get("name") || "Untitled"),
      count: Number(formData.get("count") || 12),
      variants: Math.max(1, Number(formData.get("variants") || 1)),
      allCombos: formData.get("allCombos") === "on",
      speedAmt: Math.max(0, Number(formData.get("speedAmt") || 0)),
      colorAmt: Math.max(0, Number(formData.get("colorAmt") || 0)),
      cropAmt: Math.max(0, Number(formData.get("cropAmt") || 0)),
      speedOn: Number(formData.get("speedAmt") || 0) > 0,
      colorOn: Number(formData.get("colorAmt") || 0) > 0,
      zoomOn: Number(formData.get("cropAmt") || 0) > 0,
      campaignId: String(formData.get("campaignId") || "") || null,
      accountId: String(formData.get("accountId") || "") || null,
    },
  });
  redirect(`/repurposer/${id}`);
}
