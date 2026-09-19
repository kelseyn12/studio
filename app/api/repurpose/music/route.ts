import { NextResponse } from "next/server";
import { saveUpload } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";

export async function POST(request: Request) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const form = await request.formData();
  const batchId = String(form.get("batchId") || "");
  const file = form.get("file");
  if (!batchId || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  const saved = await saveUpload(file, `music/${batchId}`);
  await prisma.repurposeTrack.create({
    data: { batchId, path: saved.path, filename: saved.filename },
  });
  return NextResponse.json({ ok: true });
}
