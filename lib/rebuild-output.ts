import { stat } from "fs/promises";
import path from "path";
import { groupWords, writeCaptionAss } from "@/lib/captions";
import { spokenOnClip } from "@/lib/captions-math";
import { assembleVideo, type ClipTrim } from "@/lib/ffmpeg";
import { deleteUpload, ensureLocal, localRoot, uploadLocalToR2 } from "@/lib/files";
import { isLogoFile, parseLogoItems, writeLogoSheet } from "@/lib/hook-logos";
import { boxFor, parseHookLayout, posFor } from "@/lib/hook-layout";
import {
  chosenTrackId,
  parseCaptionMap,
  parseRecipe,
  wordsForClip,
  type OutputRecipe,
} from "@/lib/output-recipe";
import { prisma } from "@/lib/prisma";
import { hasR2 } from "@/lib/r2";
import type { RepurposeClip, RepurposeOut, RepurposeTrack } from "@prisma/client";

type Loaded = RepurposeOut & { batch: { clips: RepurposeClip[]; tracks: RepurposeTrack[]; listCount: number } };

function trimOf(row: OutputRecipe["clips"][number]): ClipTrim {
  return { start: row.trimStart, end: row.trimEnd != null && row.trimEnd > row.trimStart ? row.trimEnd : null };
}

async function logoPathFor(hook: RepurposeClip | undefined): Promise<string | undefined> {
  if (!hook) return undefined;
  const items = parseLogoItems(hook.logosJson);
  if (!items.length) return undefined;
  const files = items.filter(isLogoFile);
  const pos = parseHookLayout(hook.hookLayout);
  const relative = await writeLogoSheet(
    await Promise.all(files.map((logo) => ensureLocal(logo.path))),
    files,
    Boolean(pos?.logoEq) && !items.some((item) => "kind" in item && item.kind === "mark"),
    items,
  );
  return path.join(localRoot(), relative);
}

/** Re-burns one finished video from its recipe, with this row's words and music. */
export async function rebuildOutput(outputId: string): Promise<void> {
  const output = await prisma.repurposeOut.findUnique({
    where: { id: outputId },
    include: { batch: { include: { clips: true, tracks: true } } },
  });
  if (!output) throw new Error("That video is gone");
  const recipe = parseRecipe(output.recipeJson);
  if (!recipe) throw new Error("Generate this batch again before tuning old videos");
  await burn(output, recipe);
}

export async function rebuildBody(outputId: string, bodyClipId: string): Promise<number> {
  const output = await prisma.repurposeOut.findUnique({ where: { id: outputId } });
  if (!output) return 0;
  const mates = await prisma.repurposeOut.findMany({ where: { batchId: output.batchId } });
  const ids = mates.filter((row) => parseRecipe(row.recipeJson)?.bodyClipId === bodyClipId).map((row) => row.id);
  for (const id of ids) await rebuildOutput(id);
  return ids.length;
}

async function burn(output: Loaded, recipe: OutputRecipe): Promise<void> {
  const clips = new Map(output.batch.clips.map((clip) => [clip.id, clip]));
  const map = parseCaptionMap(output.captionsJson);
  const hook = clips.get(recipe.clips[0]?.id || "");
  const hookPos = parseHookLayout(hook?.hookLayout);
  const trackId = chosenTrackId(output.musicTrackId, recipe.trackId);
  const track = output.batch.tracks.find((row) => row.id === trackId);
  const musicPath = track ? await ensureLocal(track.path) : undefined;
  const assembled = await Promise.all(
    recipe.clips.map(async (row) => {
      const clip = clips.get(row.id);
      if (!clip) throw new Error("A clip in this video was deleted. Generate the batch again.");
      const layout = parseHookLayout(clip.hookLayout);
      const words = spokenOnClip(clip.slot) ? wordsForClip(map, clip.id, clip.captionsJson) : [];
      const phrases = groupWords(words);
      return {
        path: await ensureLocal(clip.path),
        hookText: row.hookText || undefined,
        trim: trimOf(row),
        hookX: posFor(layout, recipe.look).x,
        hookY: posFor(layout, recipe.look).y,
        listItems: layout?.list,
        listAt: layout?.listAt,
        textFrom: layout?.from,
        textTo: layout?.to,
        box: boxFor(layout, recipe.look),
        captionFilters: phrases.length ? [await writeCaptionAss(phrases, row.trimStart, recipe.look)] : undefined,
      };
    }),
  );
  const outputRel = await assembleVideo({
    clips: assembled,
    outputName: path.basename(output.path),
    speed: recipe.speed,
    saturation: recipe.saturation,
    contrast: recipe.contrast,
    hue: recipe.hue,
    crop: recipe.crop,
    mirror: recipe.mirror,
    hookColor: recipe.hookColor,
    accentColor: recipe.accentColor,
    hookStyle: recipe.look,
    hookList: recipe.hookList || output.batch.listCount,
    musicPath,
    musicStart: musicPath ? output.musicStart : 0,
    logoPath: await logoPathFor(hook),
    hookX: posFor(hookPos, recipe.look).x,
    hookY: posFor(hookPos, recipe.look).y,
  });
  const size = (await stat(path.join(localRoot(), outputRel))).size;
  const publicUrl = await uploadLocalToR2(outputRel, "video/mp4");
  if (output.cardId) {
    await prisma.asset.updateMany({
      where: { cardId: output.cardId, path: output.path },
      data: { size, publicUrl, path: outputRel },
    });
  }
  await prisma.repurposeOut.update({ where: { id: output.id }, data: { path: outputRel } });
  if (outputRel !== output.path) await deleteUpload(output.path);
}
