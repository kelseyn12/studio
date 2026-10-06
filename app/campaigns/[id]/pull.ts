"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { pullSince } from "@/lib/hand-posts";
import { pullDealPosts } from "@/lib/pull-deal";

export async function pullDeal(formData: FormData) {
  const user = await requireUser();
  if (user.role === "EDITOR") redirect("/edits");
  const id = String(formData.get("id") || "");
  if (!id) redirect("/campaigns");
  const since = pullSince(String(formData.get("since") || ""));
  let result;
  try {
    result = await pullDealPosts(id, since);
  } catch {
    redirect(`/campaigns/${id}?pull=fail`);
  }
  if (result.accounts === 0) redirect(`/campaigns/${id}?pull=none`);
  if (result.pending) redirect(`/campaigns/${id}?pull=wait`);
  redirect(`/campaigns/${id}?pull=${result.added}${result.more ? "&more=1" : ""}`);
}
