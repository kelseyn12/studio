import { stat } from "fs/promises";
import path from "path";
import { captionFilters, groupWords, parseCaptionWords, transcribeWords, type CaptionPhrase } from "@/lib/captions";
import { assembleVideo, quietEnds, NO_TRIM, type ClipTrim } from "@/lib/ffmpeg";
import { ensureLocal, localRoot, uploadLocalToR2 } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { pickTracks } from "@/lib/combinations";
import { targetAccounts } from "@/lib/targets";
import { stripHighlight } from "@/lib/ass";
import { hookLooks } from "@/lib/text-style";
import { parseHookLines, variationFor } from "@/lib/variations";
import type { RepurposeBatch, RepurposeClip, RepurposeTrack } from "@prisma/client";

type Combo = RepurposeClip[];

const LOOK_TAG: Record<string, string> = { instagram: "IG look", tiktok: "TT look", plain: "plain" };

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
    // Deal batches post to every account on the deal; the text look follows that set.
    const targets = targetAccounts(await prisma.socialAccount.findMany(), batch);
    const accountId = targets[0]?.id ?? batch.accountId;
    const networks = targets.map((target) => target.network);
    const trims = new Map<string, ClipTrim>();
    if (batch.trimOn) {
      for (const clip of batch.clips) {
        const local = await ensureLocal(clip.path);
        trims.set(clip.path, await quietEnds(local));
      }
    }
    // Spoken captions: listen to each clip once, remember the words on the clip.
    const phrasesByClip = new Map<string, CaptionPhrase[]>();
    if (batch.captionsOn) {
      for (const clip of batch.clips) {
        let words = parseCaptionWords(clip.captionsJson);
        if (words.length === 0) {
          const local = await ensureLocal(clip.path);
          words = await transcribeWords(local);
          await prisma.repurposeClip.update({
            where: { id: clip.id },
            data: { captionsJson: JSON.stringify(words) },
          });
        }
        phrasesByClip.set(clip.path, groupWords(words));
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
          const hookLine = line || combo.find((clip) => clip.slot === "HOOK")?.hookText || "";
          const clips = await Promise.all(
            combo.map(async (clip, index) => {
              const trim = trims.get(clip.path) ?? NO_TRIM;
              const phrases = phrasesByClip.get(clip.path);
              return {
                path: await ensureLocal(clip.path),
                hookText: index === 0 ? line || clip.hookText || undefined : undefined,
                trim,
                captionFilters: phrases?.length ? captionFilters(phrases, trim.start) : undefined,
              };
            }),
          );
          const musicPath = music ? await ensureLocal(music.path) : undefined;
          const title = `${batch.name} · ${fileNumber}`;
          // Cross-posting deals get one file per app look; each ships to its own accounts.
          const looks = hookLooks(batch.textStyle, networks, Boolean(hookLine));
          const files = [];
          for (const look of looks) {
            const suffix = looks.length > 1 ? `-${look}` : "";
            const outputRel = await assembleVideo({
              clips,
              outputName: `${id}-${fileNumber}${suffix}.mp4`,
              ...filters,
              hookStyle: look,
              hookList: batch.listCount,
              musicPath,
            });
            files.push({
              kind: "GENERATED" as const,
              filename: `${title}${suffix}.mp4`,
              path: outputRel,
              mime: "video/mp4",
              size: (await stat(path.join(localRoot(), outputRel))).size,
              publicUrl: await uploadLocalToR2(outputRel, "video/mp4"),
              textStyle: look,
            });
          }
          const card = await prisma.card.create({
            data: {
              title,
              status: "READY",
              campaignId: batch.campaignId,
              formatId: batch.formatId,
              accountId,
              createdById: userId,
              hook: stripHighlight(hookLine),
              caption: batch.caption,
              editorNote: `Uniqueness: ${variation.label}`,
              payoutCents: basePayCents,
              assets: { create: files },
            },
          });
          await prisma.repurposeOut.createMany({
            data: files.map((file) => ({
              batchId: id,
              cardId: card.id,
              path: file.path,
              label: `${title} · ${variation.label}${looks.length > 1 ? ` · ${LOOK_TAG[file.textStyle]}` : ""}`,
            })),
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
