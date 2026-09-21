"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SLUG_LENGTH = 6;

function makeSlug(): string {
  return Math.random().toString(36).slice(2, 2 + SLUG_LENGTH);
}

export async function addLink(formData: FormData) {
  await requireUser();
  const targetUrl = String(formData.get("targetUrl") || "").trim();
  if (!/^https?:\/\//.test(targetUrl)) return;
  const wanted = String(formData.get("slug") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  await prisma.shortLink.create({
    data: {
      slug: wanted || makeSlug(),
      targetUrl,
      label: String(formData.get("label") || "").trim(),
    },
  });
  revalidatePath("/dms");
}

export async function deleteLink(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.shortLink.delete({ where: { id } }).catch(() => {});
  revalidatePath("/dms");
}
