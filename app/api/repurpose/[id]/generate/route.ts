import { stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { pickCombos, pickTracks } from "@/lib/combinations";
import { assembleVideo, quietEnds, NO_TRIM, type ClipTrim } from "@/lib/ffmpeg";
import { ensureLocal, localRoot, uploadLocalToR2 } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";
import { parseHookLines, variationFor } from "@/lib/variations";

export const maxDuration = 300;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const { id } = await context.params;
  const form = await request.formData().catch(() => null);
  if (form) {
    await prisma.repurposeBatch.update({
      where: { id },
      data: {
        name: String(form.get("name") || "Untitled"),
        count: Number(form.get("count") || 12),
        variants: Math.max(1, Number(form.get("variants") || 1)),
        allCombos: form.get("allCombos") === "on",
        speedAmt: Math.max(0, Number(form.get("speedAmt") || 0)),
        colorAmt: Math.max(0, Number(form.get("colorAmt") || 0)),
        cropAmt: Math.max(0, Number(form.get("cropAmt") || 0)),
        speedOn: Number(form.get("speedAmt") || 0) > 0,
        colorOn: Number(form.get("colorAmt") || 0) > 0,
        zoomOn: Number(form.get("cropAmt") || 0) > 0,
        mirrorOn: form.get("mirrorOn") === "on",
        trimOn: form.get("trimOn") === "on",
        hookLines: String(form.get("hookLines") || ""),
        caption: String(form.get("caption") || ""),
        campaignId: String(form.get("campaignId") || "") || null,
        accountId: String(form.get("accountId") || "") || null,
      },
    });
  }
  const batch = await prisma.repurposeBatch.findUnique({
    where: { id },
    include: { clips: true, tracks: true },
  });
  if (!batch) return NextResponse.json({ error: "Missing batch" }, { status: 404 });
  const hooks = batch.clips.filter((clip) => clip.slot === "HOOK");
  const bodies = batch.clips.filter((clip) => clip.slot === "DEMO");
  const ctas = batch.clips.filter((clip) => clip.slot === "CTA");
  const combos = pickCombos([hooks, bodies, ctas], batch.count, batch.allCombos);
  if (combos.length === 0) {
    return NextResponse.json({ error: "Add clips first" }, { status: 400 });
  }
  if (!batch.accountId) {
    return NextResponse.json({ error: "Pick an account so these post to the right @" }, { status: 400 });
  }
  const campaign = batch.campaignId
    ? await prisma.campaign.findUnique({ where: { id: batch.campaignId } })
    : null;
  const copies = Math.max(batch.variants, 1);
  const textLines = parseHookLines(batch.hookLines);
  const lines: Array<string | null> = textLines.length ? textLines : [null];
  const musicQueue = pickTracks(batch.tracks, combos.length * lines.length * copies);
  await prisma.repurposeBatch.update({ where: { id }, data: { status: "rendering" } });
  try {
    const trims = new Map<string, ClipTrim>();
    if (batch.trimOn) {
      for (const clip of batch.clips) {
        const local = await ensureLocal(clip.path);
        trims.set(clip.path, await quietEnds(local));
      }
    }
    let fileNumber = 0;
    for (const combo of combos) {
      for (const line of lines) {
        for (let copy = 0; copy < copies; copy += 1) {
        const variation = variationFor(fileNumber, batch);
        const { label, ...filters } = variation;
        const music = musicQueue[fileNumber];
        fileNumber += 1;
        const outputRel = await assembleVideo({
          clips: await Promise.all(
            combo.map(async (clip, index) => ({
              path: await ensureLocal(clip.path),
              hookText: index === 0 ? line || clip.hookText || undefined : undefined,
              trim: trims.get(clip.path) ?? NO_TRIM,
            })),
          ),
          outputName: `${id}-${fileNumber}.mp4`,
          ...filters,
          musicPath: music ? await ensureLocal(music.path) : undefined,
        });
        const outputBytes = (await stat(path.join(localRoot(), outputRel))).size;
        const publicUrl = await uploadLocalToR2(outputRel, "video/mp4");
        const title = `${batch.name} · ${fileNumber}`;
        const card = await prisma.card.create({
          data: {
            title,
            status: "READY",
            campaignId: batch.campaignId,
            accountId: batch.accountId,
            createdById: user.id,
            hook: line || combo.find((clip) => clip.slot === "HOOK")?.hookText || "",
            caption: batch.caption,
            editorNote: `Uniqueness: ${variation.label}`,
            payoutCents: campaign?.basePayCents ?? 0,
            assets: {
              create: {
                kind: "GENERATED",
                filename: `${title}.mp4`,
                path: outputRel,
                mime: "video/mp4",
                size: outputBytes,
                publicUrl,
              },
            },
          },
        });
        await prisma.repurposeOut.create({
          data: {
            batchId: id,
            cardId: card.id,
            path: outputRel,
            label: `${title} · ${variation.label}`,
          },
        });
        }
      }
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
  return NextResponse.redirect(new URL("/calendar?ship=batch", request.url));
}
