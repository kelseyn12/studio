import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; account_id?: string; username?: string; network?: string; error?: string }>;
}) {
  const params = await searchParams;
  if (params.success === "true" && params.account_id) {
    await prisma.socialAccount.upsert({
      where: { outstandAccountId: params.account_id },
      update: { username: params.username || "unknown", isActive: true },
      create: {
        outstandAccountId: params.account_id,
        username: params.username || "unknown",
        network: params.network || "instagram",
        nickname: params.username || "",
      },
    });
  }
  redirect("/connections");
}
