import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";
import { clientKey, rateLimit } from "@/lib/rate-limit";

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
  if (file instanceof File && file.size > 0 && process.env.OPENAI_API_KEY) {
    const body = new FormData();
    body.set("model", "whisper-1");
    body.set("file", file);
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body,
    });
    const payload = await response.json();
    text = payload.text || payload.error?.message || "Whisper returned no text.";
  } else if (sourceUrl) {
    text = `Queued from ${sourceUrl}. Add OPENAI_API_KEY and upload the file to transcribe.`;
  } else {
    text = "Add a file plus OPENAI_API_KEY, or paste a URL.";
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
