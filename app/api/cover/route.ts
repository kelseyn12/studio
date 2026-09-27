import { NextResponse } from "next/server";
import { writeThumb } from "@/lib/ffmpeg";
import { ensureLocal, localRoot, uploadLocalToR2 } from "@/lib/files";
import { hasR2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readSession } from "@/lib/session";

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "cover"), 30)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const id = String(body?.id || "");
  const at = Math.max(0, Number(body?.at) || 0);
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: "Missing video" }, { status: 404 });
  const local = await ensureLocal(asset.path);
  const coverPath = await writeThumb(local, `thumbs/covers/${asset.id}.jpg`, at);
  if (hasR2()) await uploadLocalToR2(coverPath, "image/jpeg");
  await prisma.asset.update({ where: { id }, data: { coverPath, coverAt: at } });
  return NextResponse.json({ ok: true, coverPath });
}
