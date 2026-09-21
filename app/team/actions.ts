"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { hasClerk } from "@/lib/clerk-mode";
import { prisma } from "@/lib/prisma";

export async function removeMember(formData: FormData) {
  const id = String(formData.get("id"));
  const me = await requireUser();
  if (me.id === id) redirect("/team?error=self");
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) redirect("/team");
  if (user.role === "CREATOR") {
    const creators = await prisma.user.count({ where: { role: "CREATOR" } });
    if (creators <= 1) redirect("/team?error=last-creator");
  }
  await prisma.user.delete({ where: { id } });
  if (hasClerk() && user.clerkId) {
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      await client.users.deleteUser(user.clerkId);
    } catch {
      /* Studio access is already gone; Clerk account cleanup can be done from the Clerk dashboard */
    }
  }
  redirect("/team");
}
