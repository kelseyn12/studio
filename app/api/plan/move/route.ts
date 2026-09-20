import { NextResponse } from "next/server";
import { parseLocalDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readSession } from "@/lib/session";

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "plan-move"), 40)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const body = await request.json();
  const cardId = String(body.cardId || "");
  const plannedDate = body.plannedDate ? parseLocalDate(String(body.plannedDate)) : null;
  if (!cardId) return NextResponse.json({ error: "Missing card" }, { status: 400 });
  await prisma.card.update({ where: { id: cardId }, data: { plannedDate } });
  return NextResponse.json({ ok: true });
}
