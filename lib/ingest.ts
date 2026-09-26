import { rename, rm, stat } from "fs/promises";
import { ffprobeBin, runCommand, runFfmpeg } from "@/lib/ffmpeg";
import { saveLocalUpload, uploadLocalToR2 } from "@/lib/files";
import type { SavedFile } from "@/lib/r2";

/** Multiply builds 1080×1920, so anything sharper than 1080 on its short side is wasted bytes. */
export const INGEST_SHORT_SIDE = 1080;
const SHRINK_CRF = "20";

export type VideoSize = { width: number; height: number };

export function needsShrink(size: VideoSize): boolean {
  if (size.width <= 0 || size.height <= 0) return false;
  return Math.min(size.width, size.height) > INGEST_SHORT_SIDE;
}

/** Scale so the short side becomes 1080 and the long side follows; -2 keeps it even for h264. */
export function shrinkScaleFilter(size: VideoSize): string {
  return size.width >= size.height ? `scale=-2:${INGEST_SHORT_SIDE}` : `scale=${INGEST_SHORT_SIDE}:-2`;
}

export function parseVideoSize(raw: string): VideoSize {
  const [width, height] = raw
    .trim()
    .split(/[x,\s]+/)
    .map((value) => Number(value));
  return { width: width || 0, height: height || 0 };
}

export async function videoSize(fileAbs: string): Promise<VideoSize> {
  const stdout = await runCommand(ffprobeBin(), [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height",
    "-of",
    "csv=s=x:p=0",
    fileAbs,
  ]);
  return parseVideoSize(stdout);
}

/** Re-encodes a phone clip down to a 1080 short side. Replaces the file in place, keeps the .mp4 name. */
export async function shrinkClip(fileAbs: string, size: VideoSize): Promise<number> {
  const tempAbs = `${fileAbs}.shrink.mp4`;
  await runFfmpeg([
    "-i",
    fileAbs,
    "-vf",
    shrinkScaleFilter(size),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    SHRINK_CRF,
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    tempAbs,
  ]);
  await rm(fileAbs, { force: true });
  await rename(tempAbs, fileAbs);
  return (await stat(fileAbs)).size;
}

export const UNREADABLE_CLIP = "That file is not a video Studio can read. Export it as MP4 or MOV and drop it again.";

/** Store a raw phone clip: 4K gets shrunk to 1080 before it goes to R2. Throws UNREADABLE_CLIP for files ffprobe cannot open. */
export async function ingestClip(file: File, folder: string): Promise<SavedFile> {
  const local = await saveLocalUpload(file, folder);
  let dimensions: VideoSize;
  try {
    dimensions = await videoSize(local.absolute);
    if (dimensions.width <= 0 || dimensions.height <= 0) throw new Error("no video stream");
  } catch {
    await rm(local.absolute, { force: true });
    throw new Error(UNREADABLE_CLIP);
  }
  let size = local.size;
  let mime = local.mime;
  if (needsShrink(dimensions)) {
    size = await shrinkClip(local.absolute, dimensions);
    mime = "video/mp4";
  }
  const publicUrl = await uploadLocalToR2(local.relative, mime);
  return { filename: file.name, path: local.relative, mime, size, publicUrl };
}
