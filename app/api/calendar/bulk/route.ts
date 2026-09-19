import { NextResponse } from "next/server";
import { addDays, startOfDay } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";

export async function POST(request: Request) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const body = await request.json();
  const perDay = Math.max(1, Number(body.perDay || 5));
  const intervalMin = Math.max(15, Number(body.intervalMin || 90));
  const startHour = Number(body.startHour ?? 10);
  const start = body.startDate ? startOfDay(new Date(body.startDate)) : startOfDay(new Date());
  const accountId = body.accountId ? String(body.accountId) : null;
  const cards = await prisma.card.findMany({
    where: { status: "READY", scheduledAt: null },
    orderBy: { createdAt: "asc" },
  });
  for (const [index, card] of cards.entries()) {
    const dayOffset = Math.floor(index / perDay);
    const slot = index % perDay;
    const when = addDays(start, dayOffset);
    when.setHours(startHour, 0, 0, 0);
    when.setMinutes(slot * intervalMin);
    await prisma.card.update({
      where: { id: card.id },
      data: {
        scheduledAt: when,
        plannedDate: startOfDay(when),
        accountId: accountId || card.accountId,
      },
    });
  }
  return NextResponse.json({ ok: true, scheduled: cards.length });
}
