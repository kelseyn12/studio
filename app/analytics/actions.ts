"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function multiplyWinner(formData: FormData) {
  await requireUser();
  const cardId = String(formData.get("cardId") || "");
  const card = cardId ? await prisma.card.findUnique({ where: { id: cardId } }) : null;
  const hook = (card?.hook || card?.title || "Winner").trim();
  const batch = await prisma.repurposeBatch.create({
    data: {
      name: `Winner · ${hook.slice(0, 40)}`,
      campaignId: card?.campaignId ?? null,
      accountId: card?.accountId ?? null,
    },
  });
  redirect(`/repurposer/${batch.id}?hook=${encodeURIComponent(hook)}`);
}
