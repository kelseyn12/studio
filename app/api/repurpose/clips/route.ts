import { NextResponse } from "next/server";
import { writeThumb } from "@/lib/ffmpeg";
import { ensureLocal, uploadLocalToR2 } from "@/lib/files";
import { ingestClip, UNREADABLE_CLIP } from "@/lib/ingest";
import { rejectStudioFile } from "@/lib/storage";
import { hasR2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readSession } from "@/lib/session";

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "clips"), 40)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const form = await request.formData();
  const batchId = String(form.get("batchId") || "");
  const slot = String(form.get("slot") || "HOOK") as "HOOK" | "DEMO" | "CTA";
  const file = form.get("file");
  if (!batchId || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  const blocked = rejectStudioFile(file.size, "RAW");
  if (blocked) return NextResponse.json({ error: blocked }, { status: 400 });
  let saved;
  try {
    saved = await ingestClip(file, `repurpose/${batchId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === UNREADABLE_CLIP) return NextResponse.json({ error: message }, { status: 400 });
    throw error;
  }
  let thumbPath = "";
  try {
    const local = await ensureLocal(saved.path);
    thumbPath = await writeThumb(local, `thumbs/${saved.path}.jpg`);
    if (hasR2()) await uploadLocalToR2(thumbPath, "image/jpeg");
  } catch {
    thumbPath = "";
  }
  const clip = await prisma.repurposeClip.create({
    data: {
      batchId,
      slot,
      path: saved.path,
      filename: saved.filename,
      size: saved.size,
      hookText: String(form.get("hookText") || ""),
      thumbPath,
    },
  });
  return NextResponse.json({ ok: true, id: clip.id });
}
