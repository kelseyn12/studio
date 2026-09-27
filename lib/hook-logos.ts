import { mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { localRoot } from "@/lib/files";
import { boxesFromItems, CANVAS_H, CANVAS_W, logoBoxes, placeLogoBoxes } from "@/lib/hook-logos-math";

export {
  LOGO_SECONDS,
  MAX_HOOK_LOGOS,
  parseLogos,
  parseLogoItems,
  stringifyLogos,
  isLogoFile,
  defaultLogoPos,
  alignLogoRow,
  snapLogoPos,
  clampLogoScale,
  itemScale,
  logoBoxes,
  boxesFromItems,
  logoOverlayFilter,
} from "@/lib/hook-logos-math";

function escapeDraw(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/'/g, "\u2019").replace(/:/g, "\\:");
}

/** Transparent 1080×1920 sheet: logo files plus optional + = emoji text. */
export async function writeLogoSheet(
  absPaths: string[],
  places: Array<{ x?: number; y?: number }> = [],
  equation = false,
  items?: import("@/lib/hook-logos-math").LogoItem[],
): Promise<string> {
  const boxes = items?.length
    ? boxesFromItems(items)
    : placeLogoBoxes(logoBoxes(absPaths.length, equation), places);
  if (!boxes.length) throw new Error("Drop a logo or add + = emoji text");
  const outputRel = `generated/hook-logos-${randomUUID()}.png`;
  const outputAbs = path.join(localRoot(), outputRel);
  await mkdir(path.dirname(outputAbs), { recursive: true });
  const { HOOK_FONT, runFfmpeg } = await import("@/lib/ffmpeg");
  const args: string[] = ["-f", "lavfi", "-i", `color=black@0.0:s=${CANVAS_W}x${CANVAS_H},format=rgba`];
  for (const file of absPaths) args.push("-i", file);
  const chains: string[] = ["[0:v]format=rgba[bg]"];
  let last = "bg";
  let step = 0;
  for (const box of boxes) {
    if (box.kind === "logo") {
      const scaled = `l${box.index}`;
      chains.push(
        `[${box.index + 1}:v]scale=${box.w}:${box.h}:force_original_aspect_ratio=decrease:flags=lanczos,format=rgba[${scaled}]`,
      );
      const next = `s${step}`;
      chains.push(
        `[${last}][${scaled}]overlay=${box.x}+(${box.w}-w)/2:${box.y}+(${box.h}-h)/2:format=auto[${next}]`,
      );
      last = next;
      step += 1;
    } else {
      const next = `s${step}`;
      chains.push(
        `[${last}]drawtext=fontfile='${HOOK_FONT}':text='${escapeDraw(box.text)}':fontsize=${box.size}:fontcolor=white:borderw=6:bordercolor=black:x=${box.x}:y=${box.y}[${next}]`,
      );
      last = next;
      step += 1;
    }
  }
  args.push("-filter_complex", chains.join(";"), "-map", `[${last}]`, "-frames:v", "1", outputAbs);
  await runFfmpeg(args);
  return outputRel;
}
