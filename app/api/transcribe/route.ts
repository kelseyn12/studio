import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { hasOpenAI, transcribeFile } from "@/lib/whisper";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "transcribe"), 8)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const form = await request.formData();
  const title = String(form.get("title") || "Transcript");
  const sourceUrl = String(form.get("sourceUrl") || "");
  const file = form.get("file");
  let text = "";
  try {
    if (file instanceof File && file.size > 0) {
      text = await transcribeFile(file);
    } else if (sourceUrl) {
      text = hasOpenAI()
        ? "A link is only a reminder. Upload the mp4 or audio so Whisper can hear it."
        : "Add OPENAI_API_KEY to .env, restart, then upload the file.";
    } else {
      text = "Drop an audio or video file.";
    }
  } catch (error) {
    text = error instanceof Error ? error.message : "Transcription failed";
  }
  await prisma.transcript.create({
    data: {
      title,
      sourceUrl,
      filename: file instanceof File ? file.name : "",
      text,
    },
  });
  return NextResponse.redirect(new URL("/transcriber", request.url));
}
