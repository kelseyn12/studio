import { mkdir, rename, rm } from "fs/promises";
import path from "path";
import { localRoot } from "@/lib/files";
import { runFfmpeg } from "@/lib/ffmpeg";

/** YouTube custom thumbs are 1280×720. A 9:16 cover is padded so the chosen frame stays intact. */
export const YOUTUBE_THUMB_FILTER =
  "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black";

export async function writeYoutubeThumb(coverAbs: string, outputRel: string): Promise<string> {
  const outputAbs = path.join(localRoot(), outputRel);
  await mkdir(path.dirname(outputAbs), { recursive: true });
  await runFfmpeg(["-i", coverAbs, "-vf", YOUTUBE_THUMB_FILTER, "-q:v", "3", outputAbs]);
  return outputRel;
}

/**
 * Instagram rejects MP4s that still have an edit list (Multiply concat writes one). Re-encode in
 * place so the file Outstand sends is a single timeline.
 */
export async function withoutEditLists(fileAbs: string): Promise<void> {
  const tempAbs = `${fileAbs}.ig.mp4`;
  await runFfmpeg([
    "-i",
    fileAbs,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-use_editlist",
    "0",
    "-avoid_negative_ts",
    "make_zero",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    tempAbs,
  ]);
  await rm(fileAbs, { force: true });
  await rename(tempAbs, fileAbs);
}
