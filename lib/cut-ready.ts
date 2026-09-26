import { pingStudio } from "@/lib/manychat";
import { prisma } from "@/lib/prisma";
import { dropSuperseded } from "@/lib/sweep";

export async function markCutReady(id: string): Promise<void> {
  const card = await prisma.card.update({ where: { id }, data: { status: "REVIEW" } });
  await dropSuperseded(id);
  try {
    await pingStudio("creator", `Ready to watch: ${card.title}. Open Cuts.`);
  } catch {
    /* Today and Cuts still show To approve */
  }
}
