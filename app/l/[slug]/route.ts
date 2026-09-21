import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  if (!rateLimit(clientKey(request, "link"), 60)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const { slug } = await context.params;
  const link = await prisma.shortLink.findUnique({ where: { slug } });
  if (!link) return NextResponse.redirect(new URL("/", request.url));
  await prisma.shortLink.update({ where: { slug }, data: { clicks: { increment: 1 } } });
  return NextResponse.redirect(link.targetUrl);
}
