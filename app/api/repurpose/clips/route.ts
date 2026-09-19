import { NextResponse } from "next/server";
import { writeThumb } from "@/lib/ffmpeg";
import { absoluteUpload, saveUpload } from "@/lib/files";
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
  const saved = await saveUpload(file, `repurpose/${batchId}`);
  let thumbPath = "";
  try {
    thumbPath = await writeThumb(absoluteUpload(saved.path), `thumbs/${saved.path}.jpg`);
  } catch {
    thumbPath = "";
  }
  const clip = await prisma.repurposeClip.create({
    data: {
      batchId,
      slot,
      path: saved.path,
      filename: saved.filename,
      hookText: String(form.get("hookText") || ""),
      thumbPath,
    },
  });
  return NextResponse.json({ ok: true, id: clip.id });
}
