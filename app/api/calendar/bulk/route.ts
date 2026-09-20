import { NextResponse } from "next/server";
import { addDays, startOfDay } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { queueCard } from "@/lib/publish";
import { readSession } from "@/lib/session";

export const maxDuration = 300;

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
  let shipped = 0;
  const errors: string[] = [];
  for (const [index, card] of cards.entries()) {
    const dayOffset = Math.floor(index / perDay);
    const slot = index % perDay;
    const when = addDays(start, dayOffset);
    when.setHours(startHour, 0, 0, 0);
    when.setMinutes(slot * intervalMin);
    try {
      const result = await queueCard(card.id, when, accountId);
      if (result.ok && result.shipped) shipped += 1;
      if (!result.ok) errors.push(`${card.title}: ${result.error}`);
    } catch (error) {
      errors.push(`${card.title}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }
  return NextResponse.json({
    ok: errors.length === 0,
    scheduled: cards.length,
    shipped,
    error: errors[0],
  });
}
