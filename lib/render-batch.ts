import { stat } from "fs/promises";
import path from "path";
import { captionFilters, groupWords, parseCaptionWords, transcribeWords, type CaptionPhrase } from "@/lib/captions";
import { assembleVideo, NO_TRIM, writeThumb, type ClipTrim } from "@/lib/ffmpeg";
import { parseLogos, writeLogoSheet } from "@/lib/hook-logos";
import { parseHookLayout } from "@/lib/hook-layout";
import { quietEnds } from "@/lib/trim";
import { ensureLocal, localRoot, uploadLocalToR2 } from "@/lib/files";
import { hasR2 } from "@/lib/r2";
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
    let mixNumber = 0;
    for (const combo of combos) {
      mixNumber += 1;
      let textNumber = 0;
      for (const line of lines) {
        textNumber += 1;
        for (let copy = 0; copy < copies; copy += 1) {
          const variation = variationFor(fileNumber, batch);
          const music = musicQueue[fileNumber];
          fileNumber += 1;
          const hookClip = combo.find((clip) => clip.slot === "HOOK");
          const hookLine = line || hookClip?.hookText || "";
          const clips = await Promise.all(
            combo.map(async (clip, index) => {
              const trim = trims.get(clip.path) ?? NO_TRIM;
              const phrases = phrasesByClip.get(clip.path);
              const layout = parseHookLayout(clip.hookLayout);
              return {
                path: await ensureLocal(clip.path),
                hookText: index === 0 ? line || clip.hookText || undefined : clip.hookText || undefined,
                trim,
                phrases,
                hookX: layout?.x,
                hookY: layout?.y,
                listItems: layout?.list,
                textFrom: layout?.from,
                textTo: layout?.to,
              };
            }),
          );
          const musicPath = music ? await ensureLocal(music.path) : undefined;
          const logoFiles = parseLogos(hookClip?.logosJson);
          const logoPath = logoFiles.length
            ? path.join(
                localRoot(),
                await writeLogoSheet(
                  await Promise.all(logoFiles.map((logo) => ensureLocal(logo.path))),
                  logoFiles,
                  Boolean(hookPos?.logoEq),
                ),
              )
            : undefined;
          const hookPos = parseHookLayout(hookClip?.hookLayout);
          const hookTag = (stripHighlight(hookLine) || hookClip?.filename || `hook ${mixNumber}`).slice(0, 36);
          const title = [
            batch.name,
            `mix ${mixNumber}`,
            hookTag,
            textLines.length > 1 ? `text ${textNumber}` : null,
            copies > 1 ? `copy ${copy + 1}` : null,
          ]
            .filter(Boolean)
            .join(" · ");
          // Cross-posting deals get one file per app look; each ships to its own accounts.
          const looks = hookLooks(batch.textStyle, networks, Boolean(hookLine));
          const files = [];
          for (const look of looks) {
            const suffix = looks.length > 1 ? `-${look}` : "";
            const outputRel = await assembleVideo({
              clips: clips.map((clip) => ({
                path: clip.path,
                hookText: clip.hookText,
                trim: clip.trim,
                hookX: clip.hookX,
                hookY: clip.hookY,
                listItems: clip.listItems,
                textFrom: clip.textFrom,
                textTo: clip.textTo,
                captionFilters: clip.phrases?.length
                  ? captionFilters(clip.phrases, clip.trim.start, look)
                  : undefined,
              })),
              outputName: `${id}-${fileNumber}${suffix}.mp4`,
              ...variation,
              hookStyle: look,
              hookList: batch.listCount,
              musicPath,
              logoPath,
              hookX: hookPos?.x,
              hookY: hookPos?.y,
            });
            const coverAt = 0.4 + copy * 0.9;
            const coverRel = `thumbs/${outputRel}.jpg`;
            let coverPath = "";
            try {
              coverPath = await writeThumb(path.join(localRoot(), outputRel), coverRel, coverAt);
              if (hasR2()) await uploadLocalToR2(coverPath, "image/jpeg");
            } catch {
              coverPath = "";
            }
            files.push({
              kind: "GENERATED" as const,
              filename: `${title}${suffix}.mp4`,
              path: outputRel,
              mime: "video/mp4",
              size: (await stat(path.join(localRoot(), outputRel))).size,
              publicUrl: await uploadLocalToR2(outputRel, "video/mp4"),
              textStyle: look,
              coverPath,
              coverAt,
            });
          }
          const card = await prisma.card.create({
            data: {
              title,
              status: "READY",
              campaignId: batch.campaignId,
              formatId: batch.formatId,
              accountId,
              accountIds: targets.map((target) => target.id).join(","),
              createdById: userId,
              hook: stripHighlight(hookLine),
              caption: hookClip?.postCaption?.trim() || batch.caption,
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
              label: `${title}${looks.length > 1 ? ` · ${LOOK_TAG[file.textStyle]}` : ""}`,
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
