"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { bonusesFromForm, perVideoCents, serializeBonuses } from "@/lib/deal-bonuses";
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
  const dollars = (field: string) => Math.max(0, Math.round(Number(formData.get(field) || 0) * 100));
  const count = (field: string, min: number) => Math.max(min, Math.round(Number(formData.get(field) || 0)));
  const videoCount = count("videoCount", 1);
  const monthlyPayCents = dollars("monthlyPay");
  const postsPerDay = count("postsPerDay", 1);
  const postsPerDayMax = count("postsPerDayMax", 0);
  await prisma.campaign.update({
    where: { id },
    data: {
      name: String(formData.get("name") || "Untitled deal"),
      brand: String(formData.get("brand") || ""),
      status: asStatus(String(formData.get("status") || "ACTIVE")),
      // A flat month spreads over the videos owed; that is what each video gets stamped with.
      basePayCents: monthlyPayCents > 0 ? perVideoCents(monthlyPayCents, videoCount) : dollars("basePay"),
      monthlyPayCents,
      cpmCents: dollars("cpm"),
      bonusesJson: serializeBonuses(bonusesFromForm(formData)),
      videoCount,
      postsPerDay,
      postsPerDayMax: postsPerDayMax > postsPerDay ? postsPerDayMax : 0,
      accountsAllowed: count("accountsAllowed", 1),
      deliverables: String(formData.get("deliverables") || ""),
    },
  });
  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");
  revalidatePath("/");
  redirect(`/campaigns/${id}`);
}
