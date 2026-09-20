"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createBatch(formData: FormData) {
  const batch = await prisma.repurposeBatch.create({
    data: { name: String(formData.get("name") || "New batch") },
  });
  redirect(`/repurposer/${batch.id}`);
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
      speedOn: formData.get("speedOn") === "on",
      colorOn: formData.get("colorOn") === "on",
      zoomOn: formData.get("zoomOn") === "on",
      intensity: String(formData.get("intensity") || "light"),
      campaignId: String(formData.get("campaignId") || "") || null,
      accountId: String(formData.get("accountId") || "") || null,
    },
  });
  redirect(`/repurposer/${id}`);
}
