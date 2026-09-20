import { NextResponse } from "next/server";
import { parseAnalytics } from "@/lib/analytics";
import { getPostAnalytics, hasOutstand } from "@/lib/outstand";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readSession } from "@/lib/session";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "analytics-sync"), 6)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  if (!hasOutstand()) return NextResponse.json({ error: "Outstand key missing" }, { status: 400 });
  const cards = await prisma.card.findMany({
    where: { outstandPostId: { not: null } },
    select: { id: true, outstandPostId: true },
  });
  let updated = 0;
  for (const card of cards) {
    if (!card.outstandPostId) continue;
    try {
      const stats = parseAnalytics(await getPostAnalytics(card.outstandPostId));
      await prisma.card.update({
        where: { id: card.id },
        data: { views: stats.views, likes: stats.likes, comments: stats.comments },
      });
      updated += 1;
    } catch {
      /* keep going */
    }
  }
  return NextResponse.json({ ok: true, updated });
}
