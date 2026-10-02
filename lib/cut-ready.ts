import { pingStudio } from "@/lib/manychat";
import { prisma } from "@/lib/prisma";
import { dropSuperseded } from "@/lib/sweep";

export async function markCutReady(id: string): Promise<void> {
  const existing = await prisma.card.findUnique({ where: { id }, select: { status: true } });
  if (!existing) return;
  await dropSuperseded(id);
  if (existing.status === "READY" || existing.status === "POSTED" || existing.status === "DATA" || existing.status === "REVIEW") {
    return;
  }
  const card = await prisma.card.update({ where: { id }, data: { status: "REVIEW" } });
  try {
    await pingStudio("creator", `Ready to watch: ${card.title}. Open Cuts.`);
  } catch {
    /* Today and Cuts still show To approve */
  }
}
