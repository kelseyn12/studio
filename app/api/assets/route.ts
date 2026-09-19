import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { saveUpload } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "assets"), 30)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const form = await request.formData();
  const id = String(form.get("id") || "");
  const kind = String(form.get("kind") || "RAW") as "RAW" | "VOICE" | "EDITED" | "REFERENCE";
  const file = form.get("file");
  if (!id || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  const saved = await saveUpload(file, `cards/${id}`);
  await prisma.asset.create({ data: { cardId: id, kind, ...saved } });
  return NextResponse.json({ ok: true });
}
