import { NextResponse } from "next/server";
import { concatClips } from "@/lib/ffmpeg";
import { absoluteUpload } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";

function combinations<T>(groups: T[][]): T[][] {
  return groups.reduce<T[][]>((acc, group) => {
    if (group.length === 0) return acc;
    if (acc.length === 0) return group.map((item) => [item]);
    return acc.flatMap((row) => group.map((item) => [...row, item]));
  }, []);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const { id } = await context.params;
  const batch = await prisma.repurposeBatch.findUnique({
    where: { id },
    include: { clips: true },
  });
  if (!batch) return NextResponse.json({ error: "Missing batch" }, { status: 404 });
  const hooks = batch.clips.filter((clip) => clip.slot === "HOOK");
  const demos = batch.clips.filter((clip) => clip.slot === "DEMO");
  const ctas = batch.clips.filter((clip) => clip.slot === "CTA");
  const combos = combinations([hooks, demos, ctas]).slice(0, Math.max(batch.count, 1));
  await prisma.repurposeBatch.update({ where: { id }, data: { status: "rendering" } });
  for (const [index, combo] of combos.entries()) {
    const outputRel = await concatClips({
      clips: combo.map((clip) => absoluteUpload(clip.path)),
      outputName: `${id}-${index + 1}.mp4`,
      speedOn: batch.speedOn,
      colorOn: batch.colorOn,
      zoomOn: batch.zoomOn,
      intensity: batch.intensity,
    });
    await prisma.repurposeOut.create({
      data: { batchId: id, path: outputRel, label: `Variation ${index + 1}` },
    });
  }
  await prisma.repurposeBatch.update({ where: { id }, data: { status: "ready" } });
  return NextResponse.redirect(new URL(`/repurposer/${id}`, request.url));
}
