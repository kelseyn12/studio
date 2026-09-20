import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function RepurposerPage() {
  const existing = await prisma.repurposeBatch.findFirst({ orderBy: { createdAt: "desc" } });
  const batch =
    existing ??
    (await prisma.repurposeBatch.create({
      data: { name: "This week" },
    }));
  redirect(`/repurposer/${batch.id}`);
}
