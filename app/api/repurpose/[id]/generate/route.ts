import { NextResponse } from "next/server";
import { pickCombos } from "@/lib/combinations";
import { assembleVideo } from "@/lib/ffmpeg";
import { absoluteUpload } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const { id } = await context.params;
  const batch = await prisma.repurposeBatch.findUnique({
    where: { id },
    include: { clips: true, tracks: true },
  });
  if (!batch) return NextResponse.json({ error: "Missing batch" }, { status: 404 });
  const hooks = batch.clips.filter((clip) => clip.slot === "HOOK");
  const demos = batch.clips.filter((clip) => clip.slot === "DEMO");
  const ctas = batch.clips.filter((clip) => clip.slot === "CTA");
  const combos = pickCombos([hooks, demos, ctas], batch.count, batch.allCombos);
  if (combos.length === 0) {
    return NextResponse.json({ error: "Add clips first" }, { status: 400 });
  }
  const campaign = batch.campaignId
    ? await prisma.campaign.findUnique({ where: { id: batch.campaignId } })
    : null;
  await prisma.repurposeBatch.update({ where: { id }, data: { status: "rendering" } });
  try {
    for (const [index, combo] of combos.entries()) {
      const music = batch.tracks[index % Math.max(batch.tracks.length, 1)];
      const outputRel = await assembleVideo({
        clips: combo.map((clip) => ({
          path: absoluteUpload(clip.path),
          hookText: clip.hookText || undefined,
        })),
        outputName: `${id}-${index + 1}.mp4`,
        speedOn: batch.speedOn,
        colorOn: batch.colorOn,
        zoomOn: batch.zoomOn,
        intensity: batch.intensity,
        musicPath: music ? absoluteUpload(music.path) : undefined,
      });
      const title = `${batch.name} · ${index + 1}`;
      const card = await prisma.card.create({
        data: {
          title,
          status: "READY",
          campaignId: batch.campaignId,
          accountId: batch.accountId,
          createdById: user.id,
          hook: combo.find((clip) => clip.slot === "HOOK")?.hookText || "",
          payoutCents: campaign?.basePayCents ?? 0,
          assets: {
            create: {
              kind: "GENERATED",
              filename: `${title}.mp4`,
              path: outputRel,
              mime: "video/mp4",
              size: 0,
            },
          },
        },
      });
      await prisma.repurposeOut.create({
        data: { batchId: id, cardId: card.id, path: outputRel, label: title },
      });
    }
    await prisma.repurposeBatch.update({ where: { id }, data: { status: "ready" } });
  } catch (error) {
    await prisma.repurposeBatch.update({
      where: { id },
      data: { status: error instanceof Error ? error.message.slice(0, 80) : "failed" },
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Render failed" },
      { status: 500 },
    );
  }
  return NextResponse.redirect(new URL(`/repurposer/${id}`, request.url));
}
