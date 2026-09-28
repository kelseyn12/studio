import { stat } from "fs/promises";
import path from "path";
import { groupWords, parseCaptionWords, spokenOnClip, transcribeWords, writeCaptionAss, type CaptionPhrase } from "@/lib/captions";
import { assembleVideo, NO_TRIM, writeThumb, type ClipTrim } from "@/lib/ffmpeg";
import { isLogoFile, parseLogoItems, writeLogoSheet } from "@/lib/hook-logos";
import { boxFor, logoAvoidBoxes, parseHookLayout, posFor } from "@/lib/hook-layout";
import { quietEnds } from "@/lib/trim";
import { ensureLocal, localRoot, uploadLocalToR2 } from "@/lib/files";
import { hasR2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { pickTracks } from "@/lib/combinations";
import { targetAccounts } from "@/lib/targets";
import { openAiFailStatus } from "@/lib/whisper";
import { stripHighlight } from "@/lib/ass";
import type { OutputRecipe } from "@/lib/output-recipe";
import { hookLooks, LOOK_TAG } from "@/lib/text-style";
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
        if (!spokenOnClip(clip.slot)) continue;
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
              const phrases = spokenOnClip(clip.slot) ? phrasesByClip.get(clip.path) : undefined;
              const layout = parseHookLayout(clip.hookLayout);
              return {
                path: await ensureLocal(clip.path),
                hookText: index === 0 ? line || clip.hookText || undefined : clip.hookText || undefined,
                trim,
                phrases,
                hookX: layout?.x,
                hookY: layout?.y,
                places: layout?.places,
                listItems: layout?.list,
                listAt: layout?.listAt,
                textFrom: layout?.from,
                textTo: layout?.to,
                box: layout?.box,
                boxes: layout?.boxes,
              };
            }),
          );
          const musicPath = music ? await ensureLocal(music.path) : undefined;
          const hookPos = parseHookLayout(hookClip?.hookLayout);
          const logoItems = parseLogoItems(hookClip?.logosJson);
          const logoFiles = logoItems.filter(isLogoFile);
          const logoPath = logoItems.length
            ? path.join(
                localRoot(),
                await writeLogoSheet(
                  await Promise.all(logoFiles.map((logo) => ensureLocal(logo.path))),
                  logoFiles,
                  Boolean(hookPos?.logoEq) && !logoItems.some((item) => "kind" in item && item.kind === "mark"),
                  logoItems,
                ),
              )
            : undefined;
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
          const recipeClips = combo.map((clip, index) => {
            const trim = trims.get(clip.path) ?? NO_TRIM;
            return {
              id: clip.id,
              hookText: index === 0 ? line || clip.hookText || "" : clip.hookText || "",
              trimStart: trim.start,
              trimEnd: trim.end,
            };
          });
          const looks = hookLooks(
            batch.textStyle,
            networks,
            Boolean(hookLine) || batch.listCount > 0 || batch.captionsOn || clips.some((clip) => clip.listItems?.length),
          );
          const files: Array<{
            kind: "GENERATED";
            filename: string;
            path: string;
            mime: string;
            size: number;
            publicUrl: string;
            textStyle: string;
            coverPath: string;
            coverAt: number;
            recipe: OutputRecipe;
          }> = [];
          for (const look of looks) {
            const suffix = looks.length > 1 ? `-${look}` : "";
            const outputRel = await assembleVideo({
              clips: await Promise.all(
                clips.map(async (clip) => {
                  const at = posFor({ x: clip.hookX ?? 0.5, y: clip.hookY ?? 0.17, places: clip.places }, look);
                  return {
                    path: clip.path,
                    hookText: clip.hookText,
                    trim: clip.trim,
                    hookX: at.x,
                    hookY: at.y,
                    listItems: clip.listItems,
                    listAt: clip.listAt,
                    textFrom: clip.textFrom,
                    textTo: clip.textTo,
                    box: boxFor(clip, look),
                    captionFilters: clip.phrases?.length
                      ? [await writeCaptionAss(clip.phrases, clip.trim.start, look)]
                      : undefined,
                  };
                }),
              ),
              outputName: `${id}-${fileNumber}${suffix}.mp4`,
              ...variation,
              hookStyle: look,
              hookList: batch.listCount,
              musicPath,
              musicStart: 0,
              logoPath,
              avoid: logoAvoidBoxes(logoItems),
              hookX: posFor(hookPos, look).x,
              hookY: posFor(hookPos, look).y,
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
              filename: `${title}${LOOK_TAG[look] ? ` · ${LOOK_TAG[look]}` : ""}.mp4`,
              path: outputRel,
              mime: "video/mp4",
              size: (await stat(path.join(localRoot(), outputRel))).size,
              publicUrl: await uploadLocalToR2(outputRel, "video/mp4"),
              textStyle: look,
              coverPath,
              coverAt,
              recipe: {
                look,
                speed: variation.speed,
                saturation: variation.saturation,
                contrast: variation.contrast,
                hue: variation.hue,
                crop: variation.crop,
                mirror: variation.mirror,
                hookColor: variation.hookColor,
                accentColor: variation.accentColor,
                hookList: batch.listCount,
                clips: recipeClips,
                trackId: music?.id ?? "",
                bodyClipId: combo.find((clip) => clip.slot === "DEMO")?.id ?? "",
              },
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
              assets: { create: files.map(({ recipe: _recipe, ...file }) => file) },
            },
          });
          await prisma.repurposeOut.createMany({
            data: files.map((file) => ({
              batchId: id,
              cardId: card.id,
              path: file.path,
              label: title,
              recipeJson: JSON.stringify(file.recipe),
              musicTrackId: file.recipe.trackId ? "" : "none",
              musicStart: 0,
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
      data: { status: openAiFailStatus(error) },
    });
  }
}
