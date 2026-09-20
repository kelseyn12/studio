"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function renameAccount(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  await prisma.socialAccount.update({
    where: { id },
    data: { nickname: String(formData.get("nickname") || "").trim() },
  });
  revalidatePath("/connections");
  revalidatePath("/repurposer");
}
