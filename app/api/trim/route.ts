import { stat } from "fs/promises";
import { revalidatePath } from "next/cache";
import path from "path";
import { NextResponse } from "next/server";
import { cutVideo } from "@/lib/cut";
import { isPlayableCut, keepRanges, parseDrops, parseSpeed } from "@/lib/cut-math";
import { parseCutUndo } from "@/lib/hook-layout";
import { writeThumb } from "@/lib/ffmpeg";
import { deleteUpload, ensureLocal, localRoot, uploadLocalToR2 } from "@/lib/files";
import { hasR2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readSession } from "@/lib/session";
export const maxDuration = 120;

async function undoCut(target: string, id: string) {
  if (target === "clip") {
    const clip = await prisma.repurposeClip.findUnique({ where: { id } });
    const prior = parseCutUndo(clip?.cutUndo);
    if (!clip || !prior) return NextResponse.json({ error: "Nothing to undo" }, { status: 400 });
    await deleteUpload(clip.path);
    if (clip.thumbPath) await deleteUpload(clip.thumbPath);
    const keepBase = prior.basePath && prior.basePath !== prior.path;
    await prisma.repurposeClip.update({
        where: { id },
        data: {
          path: prior.path,
          thumbPath: prior.thumbPath,
          size: prior.size,
          cutUndo: keepBase
            ? JSON.stringify({ path: prior.basePath, thumbPath: "", size: 0, basePath: prior.basePath })
            : "",
        },
      });
    revalidatePath(`/repurposer/${clip.batchId}`);
    return NextResponse.json({ ok: true, path: prior.path });
  }
  if (target === "asset") {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return NextResponse.json({ error: "Missing video" }, { status: 404 });
    const newest = await prisma.asset.findFirst({
      where: { cardId: asset.cardId, kind: "EDITED", filename: { startsWith: "cut-" } },
      orderBy: { createdAt: "desc" },
    });
    if (!newest) return NextResponse.json({ error: "Nothing to undo" }, { status: 400 });
    await deleteUpload(newest.path);
    await prisma.asset.delete({ where: { id: newest.id } });
    return NextResponse.json({ ok: true, path: asset.path });
  }
  return NextResponse.json({ error: "Unknown target" }, { status: 400 });
}

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "trim"), 30)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const target = String(body?.target || "");
  const id = String(body?.id || "");
  if (body?.undo) {
    return undoCut(target, id);
  }
  const start = Number(body?.start);
  const end = Number(body?.end);
  const ranges = keepRanges({ start, end }, parseDrops(body?.drops));
  const speed = parseSpeed(body?.speed);
  if (!id || !isPlayableCut(ranges)) {
    return NextResponse.json({ error: "Keep at least half a second after the cuts" }, { status: 400 });
  }

  try {
    if (target === "clip") {
      const clip = await prisma.repurposeClip.findUnique({ where: { id } });
      if (!clip) return NextResponse.json({ error: "Missing clip" }, { status: 404 });
      const prior = parseCutUndo(clip.cutUndo);
      const basePath = prior?.basePath || clip.path;
      const sourceAbs = await ensureLocal(basePath);
      const outputRel = `repurpose/${clip.batchId}/cut-${Date.now()}.mp4`;
      await cutVideo({ sourceAbs, outputRel, ranges, speed });
      await uploadLocalToR2(outputRel, "video/mp4");
      const size = (await stat(path.join(localRoot(), outputRel))).size;
      let thumbPath = "";
      try {
        thumbPath = await writeThumb(path.join(localRoot(), outputRel), `thumbs/${outputRel}.jpg`);
        if (hasR2()) await uploadLocalToR2(thumbPath, "image/jpeg");
      } catch {
        thumbPath = clip.thumbPath;
      }
      if (prior && prior.path !== basePath) {
        await deleteUpload(prior.path);
        if (prior.thumbPath) await deleteUpload(prior.thumbPath);
      }
      await prisma.repurposeClip.update({
        where: { id },
        data: {
          path: outputRel,
          size,
          thumbPath,
          cutUndo: JSON.stringify({
            path: clip.path,
            thumbPath: clip.thumbPath,
            size: clip.size,
            basePath,
          }),
        },
      });
      revalidatePath(`/repurposer/${clip.batchId}`);
      return NextResponse.json({ ok: true, path: outputRel, basePath });
    }

    if (target === "asset") {
      const asset = await prisma.asset.findUnique({ where: { id } });
      if (!asset || (asset.kind !== "EDITED" && asset.kind !== "GENERATED")) {
        return NextResponse.json({ error: "Only finished videos can be cut here" }, { status: 400 });
      }
      const baseAsset = await prisma.asset.findFirst({
        where: {
          cardId: asset.cardId,
          kind: { in: ["GENERATED", "EDITED"] },
          NOT: { filename: { startsWith: "cut-" } },
        },
        orderBy: { createdAt: "desc" },
      });
      const sourceAbs = await ensureLocal((baseAsset ?? asset).path);
      const outputRel = `cards/${asset.cardId}/cut-${Date.now()}.mp4`;
      await cutVideo({ sourceAbs, outputRel, ranges, speed });
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
      return NextResponse.json({ ok: true, path: outputRel });
    }

    return NextResponse.json({ error: "Unknown target" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cut failed" },
      { status: 500 },
    );
  }
}
