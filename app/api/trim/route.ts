import { stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { isValidCut, trimVideo, writeThumb } from "@/lib/ffmpeg";
import { deleteUpload, ensureLocal, localRoot, uploadLocalToR2 } from "@/lib/files";
import { hasR2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readSession } from "@/lib/session";
import { dropSuperseded } from "@/lib/sweep";

export const maxDuration = 120;

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "trim"), 30)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const target = String(body?.target || "");
  const id = String(body?.id || "");
  const start = Number(body?.start);
  const end = Number(body?.end);
  if (!id || !isValidCut(start, end)) {
    return NextResponse.json({ error: "Pick a start and end at least half a second apart" }, { status: 400 });
  }

  try {
    if (target === "clip") {
      const clip = await prisma.repurposeClip.findUnique({ where: { id } });
      if (!clip) return NextResponse.json({ error: "Missing clip" }, { status: 404 });
      const sourceAbs = await ensureLocal(clip.path);
      const outputRel = `repurpose/${clip.batchId}/cut-${Date.now()}.mp4`;
      await trimVideo({ sourceAbs, outputRel, start, end });
      await uploadLocalToR2(outputRel, "video/mp4");
      const size = (await stat(path.join(localRoot(), outputRel))).size;
      let thumbPath = "";
      try {
        thumbPath = await writeThumb(path.join(localRoot(), outputRel), `thumbs/${outputRel}.jpg`);
        if (hasR2()) await uploadLocalToR2(thumbPath, "image/jpeg");
      } catch {
        thumbPath = clip.thumbPath;
      }
      await prisma.repurposeClip.update({
        where: { id },
        data: { path: outputRel, size, thumbPath },
      });
      await deleteUpload(clip.path);
      if (clip.thumbPath && thumbPath !== clip.thumbPath) await deleteUpload(clip.thumbPath);
      return NextResponse.json({ ok: true });
    }

    if (target === "asset") {
      const asset = await prisma.asset.findUnique({ where: { id } });
      if (!asset || (asset.kind !== "EDITED" && asset.kind !== "GENERATED")) {
        return NextResponse.json({ error: "Only finished videos can be cut here" }, { status: 400 });
      }
      const sourceAbs = await ensureLocal(asset.path);
      const outputRel = `cards/${asset.cardId}/cut-${Date.now()}.mp4`;
      await trimVideo({ sourceAbs, outputRel, start, end });
      const publicUrl = await uploadLocalToR2(outputRel, "video/mp4");
      const size = (await stat(path.join(localRoot(), outputRel))).size;
      await prisma.asset.create({
        data: {
          cardId: asset.cardId,
          kind: "EDITED",
          filename: `cut-${asset.filename}`,
          path: outputRel,
          mime: "video/mp4",
          size,
          publicUrl,
        },
      });
      await dropSuperseded(asset.cardId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown target" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cut failed" },
      { status: 500 },
    );
  }
}
