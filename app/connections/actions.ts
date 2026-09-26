"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Saves an account's label and which deal it belongs to. Deal videos post to every account on that deal. */
export async function saveAccount(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  await prisma.socialAccount.update({
    where: { id },
    data: {
      nickname: String(formData.get("nickname") || "").trim(),
      campaignId: String(formData.get("campaignId") || "") || null,
    },
  });
  revalidatePath("/connections");
  revalidatePath("/repurposer");
  revalidatePath("/campaigns");
}
