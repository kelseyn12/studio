"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUSES = ["TRIAL", "ACTIVE", "PAUSED", "ENDED"] as const;
type DealStatus = (typeof STATUSES)[number];

function asStatus(value: string): DealStatus {
  return STATUSES.includes(value as DealStatus) ? (value as DealStatus) : "ACTIVE";
}

export async function updateDeal(formData: FormData) {
  const user = await requireUser();
  if (user.role === "EDITOR") redirect("/edits");
  const id = String(formData.get("id") || "");
  if (!id) redirect("/campaigns");
  await prisma.campaign.update({
    where: { id },
    data: {
      name: String(formData.get("name") || "Untitled deal"),
      brand: String(formData.get("brand") || ""),
      status: asStatus(String(formData.get("status") || "ACTIVE")),
      basePayCents: Math.max(0, Math.round(Number(formData.get("basePay") || 0) * 100)),
      videoCount: Math.max(1, Number(formData.get("videoCount") || 1)),
      postsPerDay: Math.max(1, Number(formData.get("postsPerDay") || 1)),
      accountsAllowed: Math.max(1, Number(formData.get("accountsAllowed") || 1)),
      deliverables: String(formData.get("deliverables") || ""),
    },
  });
  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");
  revalidatePath("/");
  redirect(`/campaigns/${id}`);
}
