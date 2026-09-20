import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { pullMedia } from "@/lib/pull-media";
import { transcribeFile } from "@/lib/whisper";

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
      const pulled = await pullMedia(sourceUrl);
      text = await transcribeFile(pulled);
    } else {
      text = "Drop an audio or video file, or paste a TikTok / Reel / YouTube / mp4 link.";
    }
  } catch (error) {
    text = error instanceof Error ? error.message : "Transcription failed";
  }
  await prisma.transcript.create({
    data: {
      title,
      sourceUrl,
      filename: file instanceof File && file.size > 0 ? file.name : sourceUrl,
      text,
    },
  });
  return NextResponse.redirect(new URL("/transcriber", request.url));
}
