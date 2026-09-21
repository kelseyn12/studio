import { stat } from "fs/promises";
import path from "path";
import { assembleVideo, quietEnds, NO_TRIM, type ClipTrim } from "@/lib/ffmpeg";
import { ensureLocal, localRoot, uploadLocalToR2 } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { pickTracks } from "@/lib/combinations";
import { parseHookLines, variationFor } from "@/lib/variations";
import type { RepurposeBatch, RepurposeClip, RepurposeTrack } from "@prisma/client";

type Combo = RepurposeClip[];

export function renderStatus(done: number, total: number): string {
  return `rendering ${done}/${total}`;
}

export function isRendering(status: string): boolean {
  return status.startsWith("rendering");
}

/**
 * Builds every video for a batch. Runs in the background after the route
 * responds, updating batch.status as "rendering done/total" so the batch
 * page can show live progress. Failures land in batch.status too.
 */
export async function renderBatch(input: {
  batch: RepurposeBatch & { clips: RepurposeClip[]; tracks: RepurposeTrack[] };
  combos: Combo[];
  userId: string;
  basePayCents: number;
}): Promise<void> {
  const { batch, combos, userId, basePayCents } = input;
  const id = batch.id;
  const copies = Math.max(batch.variants, 1);
  const textLines = parseHookLines(batch.hookLines);
  const lines: Array<string | null> = textLines.length ? textLines : [null];
  const total = combos.length * lines.length * copies;
  const musicQueue = pickTracks(batch.tracks, total);
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
              formatId: batch.formatId,
              accountId: batch.accountId,
              createdById: userId,
              hook: line || combo.find((clip) => clip.slot === "HOOK")?.hookText || "",
              caption: batch.caption,
              editorNote: `Uniqueness: ${variation.label}`,
              payoutCents: basePayCents,
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
          await prisma.repurposeBatch.update({
            where: { id },
            data: { status: renderStatus(fileNumber, total) },
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
  }
}
