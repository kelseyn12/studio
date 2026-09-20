"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { queueCard } from "@/lib/publish";

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
