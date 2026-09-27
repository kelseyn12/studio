"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { applyCaptionLines } from "@/lib/captions-math";
import { parseCaptionMap, parseRecipe, wordsForClip } from "@/lib/output-recipe";
import { prisma } from "@/lib/prisma";
import { rebuildBody, rebuildOutput } from "@/lib/rebuild-output";

export async function tuneOutput(formData: FormData) {
  const user = await requireUser();
  if (user.role === "EDITOR") redirect("/edits");
  const outputId = String(formData.get("outputId") || "");
  const output = await prisma.repurposeOut.findUnique({
    where: { id: outputId },
    include: { batch: { include: { clips: true } } },
  });
  if (!output) redirect("/repurposer");
  const recipe = parseRecipe(output.recipeJson);
  if (!recipe) redirect(`/repurposer/${output.batchId}?tuned=old`);
  const map = parseCaptionMap(output.captionsJson);
  for (const row of recipe.clips) {
    const text = formData.get(`words:${row.id}`);
    if (typeof text !== "string") continue;
    const source = output.batch.clips.find((clip) => clip.id === row.id);
    const base = wordsForClip(map, row.id, source?.captionsJson || "");
    if (!base.length && !text.trim()) continue;
    map[row.id] = applyCaptionLines(base, text);
  }
  await prisma.repurposeOut.update({
    where: { id: outputId },
    data: {
      captionsJson: JSON.stringify(map),
      musicTrackId: String(formData.get("musicTrackId") || "none"),
      musicStart: Math.max(0, Number(formData.get("musicStart") || 0)),
    },
  });
  const scope = String(formData.get("scope") || "one");
  if (scope === "body" && recipe.bodyClipId && map[recipe.bodyClipId]) {
    const words = JSON.stringify(map[recipe.bodyClipId]);
    await prisma.repurposeClip.update({ where: { id: recipe.bodyClipId }, data: { captionsJson: words } });
    const mates = await prisma.repurposeOut.findMany({ where: { batchId: output.batchId } });
    for (const mate of mates) {
      if (mate.id === outputId) continue;
      if (parseRecipe(mate.recipeJson)?.bodyClipId !== recipe.bodyClipId) continue;
      const mateMap = parseCaptionMap(mate.captionsJson);
      mateMap[recipe.bodyClipId] = map[recipe.bodyClipId];
      await prisma.repurposeOut.update({
        where: { id: mate.id },
        data: { captionsJson: JSON.stringify(mateMap) },
      });
    }
    await rebuildBody(outputId, recipe.bodyClipId);
  } else {
    await rebuildOutput(outputId);
  }
  revalidatePath(`/repurposer/${output.batchId}`);
  redirect(`/repurposer/${output.batchId}?tuned=1`);
}
