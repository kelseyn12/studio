"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createBatch(formData: FormData) {
  await requireUser();
  const batch = await prisma.repurposeBatch.create({
    data: { name: String(formData.get("name") || "New batch") },
  });
  redirect(`/repurposer/${batch.id}`);
}

export async function resetBatch(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  await prisma.repurposeBatch.update({ where: { id }, data: { status: "draft" } });
  redirect(`/repurposer/${id}`);
}
