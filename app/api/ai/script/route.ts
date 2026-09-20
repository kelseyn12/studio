import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { writeThumb } from "@/lib/ffmpeg";
import { ensureLocal } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { generateScript } from "@/lib/script";
import { readSession } from "@/lib/session";
import { transcribeFile } from "@/lib/whisper";

export const maxDuration = 60;

function dataUrl(bytes: Buffer, mime: string): string {
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "script"), 10)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "Missing card" }, { status: 400 });
  const card = await prisma.card.findUnique({
    where: { id },
    include: { campaign: true, assets: true },
  });
  if (!card) return NextResponse.json({ error: "Missing card" }, { status: 404 });

  const refs = card.assets.filter((asset) => asset.kind === "REFERENCE").slice(0, 3);
  const transcripts: string[] = [];
  const images: string[] = [];
  for (const asset of refs) {
    try {
      const absolute = await ensureLocal(asset.path);
      const bytes = await readFile(absolute);
      if (asset.mime.startsWith("video") || asset.mime.startsWith("audio")) {
        transcripts.push(
          await transcribeFile(new File([new Uint8Array(bytes)], asset.filename, { type: asset.mime })),
        );
      }
      if (asset.mime.startsWith("image") && bytes.length < 2_000_000) {
        images.push(dataUrl(bytes, asset.mime));
      } else if (asset.mime.startsWith("video") && images.length === 0) {
        const thumb = await writeThumb(absolute, `thumbs/${asset.path}.jpg`);
        images.push(dataUrl(await readFile(await ensureLocal(thumb)), "image/jpeg"));
      }
    } catch {
      /* a bad reference must not block a script from premise + hook */
    }
  }

  try {
    const script = await generateScript(
      {
        title: String(body.title || card.title || ""),
        premise: String(body.premise || card.premise || ""),
        hook: String(body.hook || card.hook || ""),
        body: String(body.body || card.body || ""),
        plug: String(body.plug || card.plug || ""),
        script: String(body.script || card.script || ""),
        brand: card.campaign?.brand || card.campaign?.name || "",
        referenceUrl: String(body.referenceUrl || card.referenceUrl || ""),
        referenceTranscript: transcripts.filter(Boolean).join("\n"),
      },
      images,
    );
    return NextResponse.json(script);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Script failed" }, { status: 400 });
  }
}
