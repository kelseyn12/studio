import { needsChanges } from "@/lib/change-note";
import { reminderDue } from "@/lib/change-reminder";
import { pingStudio } from "@/lib/manychat";
import { prisma } from "@/lib/prisma";

type ReminderRow = { cardId: string; fixUpdatedAt: string; remindedAt: string };

async function ensureReminderTable(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS ChangeReminder (
      cardId TEXT PRIMARY KEY,
      fixUpdatedAt TEXT NOT NULL,
      remindedAt TEXT NOT NULL
    )`,
  );
}

/** One process claims the nudge. A second Studio (local and Fly) does not ping twice. */
async function claimReminder(cardId: string, fixUpdatedAt: string, remindedAt: string, seen: ReminderRow | null): Promise<boolean> {
  if (!seen) {
    const inserted = await prisma.$executeRaw`
      INSERT INTO ChangeReminder (cardId, fixUpdatedAt, remindedAt)
      VALUES (${cardId}, ${fixUpdatedAt}, ${remindedAt})
      ON CONFLICT(cardId) DO NOTHING
    `;
    return inserted > 0;
  }
  const updated = await prisma.$executeRaw`
    UPDATE ChangeReminder
    SET fixUpdatedAt = ${fixUpdatedAt}, remindedAt = ${remindedAt}
    WHERE cardId = ${cardId}
      AND fixUpdatedAt = ${seen.fixUpdatedAt}
      AND remindedAt = ${seen.remindedAt}
  `;
  return updated > 0;
}

async function releaseReminder(cardId: string, remindedAt: string, seen: ReminderRow | null): Promise<void> {
  if (!seen) {
    await prisma.$executeRaw`DELETE FROM ChangeReminder WHERE cardId = ${cardId} AND remindedAt = ${remindedAt}`;
    return;
  }
  await prisma.$executeRaw`
    UPDATE ChangeReminder
    SET fixUpdatedAt = ${seen.fixUpdatedAt}, remindedAt = ${seen.remindedAt}
    WHERE cardId = ${cardId} AND remindedAt = ${remindedAt}
  `;
}

/** Ping him again when a fix is still open. The Cuts list is the record if Discord is missed. */
export async function nudgeOpenChanges(now = new Date()): Promise<number> {
  try {
    await ensureReminderTable();
    const cards = await prisma.card.findMany({
      where: { status: "EDITING", cutBy: "EDITOR" },
      select: { id: true, title: true, editorNote: true, updatedAt: true },
    });
    const waiting = cards.filter((card) => needsChanges("EDITING", card.editorNote));
    if (waiting.length === 0) return 0;
    const rows = await prisma.$queryRaw<ReminderRow[]>`SELECT cardId, fixUpdatedAt, remindedAt FROM ChangeReminder`;
    const byId = new Map(rows.map((row) => [row.cardId, row]));
    let sent = 0;
    for (const card of waiting) {
      const fixUpdatedAt = card.updatedAt.toISOString();
      const seen = byId.get(card.id) ?? null;
      const last = seen && seen.fixUpdatedAt === fixUpdatedAt ? new Date(seen.remindedAt) : null;
      if (!reminderDue(card.updatedAt, now, last)) continue;
      const remindedAt = now.toISOString();
      const claimed = await claimReminder(card.id, fixUpdatedAt, remindedAt, seen);
      if (!claimed) continue;
      const ok = await pingStudio("editor", `Still waiting: ${card.title || "a video"}. Needs changes. Open Cuts.`).catch(() => false);
      if (!ok) {
        await releaseReminder(card.id, remindedAt, seen);
        continue;
      }
      sent += 1;
    }
    return sent;
  } catch {
    return 0;
  }
}
