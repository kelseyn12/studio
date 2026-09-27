import { NextResponse } from "next/server";
import { clampLogoScale, MAX_HOOK_LOGOS, MAX_LOGO_ITEMS, parseLogoItems, parseLogos, stringifyLogos } from "@/lib/hook-logos-math";
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
  const current = parseLogoItems(clip.logosJson);
  if (current.length >= MAX_LOGO_ITEMS) {
    return NextResponse.json({ error: "That's enough pieces on this clip" }, { status: 400 });
  }
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    const body = (await request.json()) as { mark?: unknown };
    const text = String(body.mark || "").trim().slice(0, 48);
    if (!text) return NextResponse.json({ error: "Type +, =, an emoji, or a short word" }, { status: 400 });
    await prisma.repurposeClip.update({
      where: { id },
      data: {
        logosJson: stringifyLogos([...current, { kind: "mark", id: `mark-${Date.now()}`, text }]),
      },
    });
    return NextResponse.json({ ok: true });
  }
  const files = parseLogos(clip.logosJson);
  if (files.length >= MAX_HOOK_LOGOS) {
    return NextResponse.json({ error: "Four logo files is enough on one clip" }, { status: 400 });
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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const { id } = await context.params;
  const clip = await prisma.repurposeClip.findUnique({ where: { id } });
  if (!clip) return NextResponse.json({ error: "Missing clip" }, { status: 404 });
  const body = (await request.json()) as { path?: unknown; id?: unknown; x?: unknown; y?: unknown; scale?: unknown };
  const pathValue = String(body.path || "");
  const markId = String(body.id || "");
  const next = parseLogoItems(clip.logosJson).map((item) => {
    const match = pathValue && "path" in item && item.path === pathValue;
    const mark = markId && "kind" in item && item.kind === "mark" && item.id === markId;
    if (!match && !mark) return item;
    const x = Number(body.x);
    const y = Number(body.y);
    return {
      ...item,
      ...(Number.isFinite(x) ? { x: Math.min(0.92, Math.max(0.08, x)) } : {}),
      ...(Number.isFinite(y) ? { y: Math.min(0.88, Math.max(0.08, y)) } : {}),
      ...(body.scale != null ? { scale: clampLogoScale(body.scale) } : {}),
    };
  });
  await prisma.repurposeClip.update({ where: { id }, data: { logosJson: stringifyLogos(next) } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const { id } = await context.params;
  const clip = await prisma.repurposeClip.findUnique({ where: { id } });
  if (!clip) return NextResponse.json({ error: "Missing clip" }, { status: 404 });
  const pathValue = new URL(request.url).searchParams.get("path") || "";
  const markId = new URL(request.url).searchParams.get("id") || "";
  const items = parseLogoItems(clip.logosJson);
  const removed = items.find((item) => ("path" in item && item.path === pathValue) || ("id" in item && item.id === markId));
  const next = items.filter((item) => item !== removed);
  if (removed && "path" in removed && removed.path) await deleteUpload(removed.path);
  await prisma.repurposeClip.update({ where: { id }, data: { logosJson: stringifyLogos(next) } });
  return NextResponse.json({ ok: true });
}
