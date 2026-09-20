import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { saveUpload, REFERENCE_MAX_BYTES } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { hasOpenAI, transcribeFile } from "@/lib/whisper";

export const maxDuration = 60;

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
  if (kind === "REFERENCE" && file.size > REFERENCE_MAX_BYTES) {
    return NextResponse.json({ error: "Reference too big. Use a phone clip, not a camera day." }, { status: 400 });
  }
  const saved = await saveUpload(file, `cards/${id}`);
  await prisma.asset.create({ data: { cardId: id, kind, ...saved } });
  let transcript = "";
  if (kind === "EDITED") {
    await prisma.card.update({ where: { id }, data: { status: "REVIEW" } });
  } else if (kind === "RAW" || kind === "VOICE") {
    const card = await prisma.card.findUnique({ where: { id } });
    if (card && (card.status === "IDEA" || card.status === "SCRIPTED")) {
      await prisma.card.update({ where: { id }, data: { status: "FILMED" } });
    }
  }
  if (kind === "VOICE" && hasOpenAI()) {
    try {
      transcript = await transcribeFile(file);
      const card = await prisma.card.findUnique({ where: { id } });
      const note = card?.editorNote?.trim()
        ? `${card.editorNote.trim()}\n\nVoice: ${transcript}`
        : transcript;
      await prisma.card.update({ where: { id }, data: { editorNote: note } });
    } catch (error) {
      transcript = error instanceof Error ? error.message : "Transcription failed";
    }
  }
  return NextResponse.json({ ok: true, transcript });
}
