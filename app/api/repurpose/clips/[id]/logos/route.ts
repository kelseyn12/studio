import { NextResponse } from "next/server";
import { MAX_HOOK_LOGOS, parseLogos, stringifyLogos } from "@/lib/hook-logos-math";
import { deleteUpload, mimeFromName, saveUpload } from "@/lib/files";
import { rejectStudioFile } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readSession } from "@/lib/session";

const IMAGE = /image\/(png|jpeg|webp|gif)/;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!rateLimit(clientKey(request, "logos"), 40)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const { id } = await context.params;
  const clip = await prisma.repurposeClip.findUnique({ where: { id } });
  if (!clip) return NextResponse.json({ error: "Missing clip" }, { status: 404 });
  const current = parseLogos(clip.logosJson);
  if (current.length >= MAX_HOOK_LOGOS) {
    return NextResponse.json({ error: "Four logos is enough on one hook" }, { status: 400 });
  }
  const form = await request.formData();
  const file = form.get("file");
  const mime = file instanceof File ? file.type || mimeFromName(file.name) : "";
  if (!(file instanceof File) || !IMAGE.test(mime)) {
    return NextResponse.json({ error: "Drop a PNG or JPG logo" }, { status: 400 });
  }
  const blocked = rejectStudioFile(file.size, "VOICE");
  if (blocked) return NextResponse.json({ error: blocked }, { status: 400 });
  const saved = await saveUpload(file, `repurpose/${clip.batchId}/logos`);
  await prisma.repurposeClip.update({
    where: { id },
    data: { logosJson: stringifyLogos([...current, { path: saved.path, filename: saved.filename }]) },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const { id } = await context.params;
  const clip = await prisma.repurposeClip.findUnique({ where: { id } });
  if (!clip) return NextResponse.json({ error: "Missing clip" }, { status: 404 });
  const pathValue = new URL(request.url).searchParams.get("path") || "";
  const next = parseLogos(clip.logosJson).filter((logo) => logo.path !== pathValue);
  const removed = parseLogos(clip.logosJson).find((logo) => logo.path === pathValue);
  if (removed) await deleteUpload(removed.path);
  await prisma.repurposeClip.update({ where: { id }, data: { logosJson: stringifyLogos(next) } });
  return NextResponse.json({ ok: true });
}
