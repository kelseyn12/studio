import { copyFile, mkdir, open, rename, rm } from "fs/promises";
import path from "path";
import { localRoot } from "@/lib/files";
import { clipHasAudio, runFfmpeg } from "@/lib/ffmpeg";

/** YouTube custom thumbs are 1280×720. A 9:16 cover is padded so the chosen frame stays intact. */
export const YOUTUBE_THUMB_FILTER =
  "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black";

export async function writeYoutubeThumb(coverAbs: string, outputRel: string): Promise<string> {
  const outputAbs = path.join(localRoot(), outputRel);
  await mkdir(path.dirname(outputAbs), { recursive: true });
  await runFfmpeg(["-i", coverAbs, "-vf", YOUTUBE_THUMB_FILTER, "-q:v", "3", outputAbs]);
  return outputRel;
}

const EDIT_LIST = Buffer.from("elst");

/** True when the MP4 still has an edit list. A clean Multiply file does not, so Schedule can upload it. */
export async function fileHasEditList(fileAbs: string): Promise<boolean> {
  const handle = await open(fileAbs, "r");
  try {
    const { size } = await handle.stat();
    const window = Math.min(size, 1024 * 1024);
    const head = Buffer.alloc(window);
    await handle.read(head, 0, window, 0);
    if (head.includes(EDIT_LIST)) return true;
    if (size <= window) return false;
    const tail = Buffer.alloc(window);
    await handle.read(tail, 0, window, size - window);
    return tail.includes(EDIT_LIST);
  } finally {
    await handle.close();
  }
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

/** How long the chosen cover sits at the front. Apps that ignore a cover image still open on this frame. */
export const COVER_HOLD_SECONDS = 0.15;

/**
 * Puts the saved cover (the frame with the hook) at the start of the file, then re-encodes
 * without an edit list. TikTok and YouTube Shorts pick a frame from the video; this makes that
 * frame the one you chose.
 */
export async function prependCover(videoAbs: string, coverAbs: string): Promise<void> {
  const tempAbs = `${videoAbs}.cover.mp4`;
  const holdMs = Math.round(COVER_HOLD_SECONDS * 1000);
  const hasAudio = await clipHasAudio(videoAbs);
  const video = "[1:v]setsar=1,fps=30,format=yuv420p,setpts=PTS-STARTPTS[vid]";
  const still =
    "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,format=yuv420p,setpts=PTS-STARTPTS[cover]";
  const chain = hasAudio
    ? `${still};${video};[cover][vid]concat=n=2:v=1:a=0[outv];[1:a]adelay=${holdMs}|${holdMs},asetpts=PTS-STARTPTS[outa]`
    : `${still};${video};[cover][vid]concat=n=2:v=1:a=0[outv]`;
  await runFfmpeg([
    "-loop",
    "1",
    "-framerate",
    "30",
    "-t",
    String(COVER_HOLD_SECONDS),
    "-i",
    coverAbs,
    "-i",
    videoAbs,
    "-filter_complex",
    chain,
    "-map",
    "[outv]",
    ...(hasAudio ? ["-map", "[outa]", "-c:a", "aac", "-b:a", "192k"] : []),
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
    tempAbs,
  ]);
  await rm(videoAbs, { force: true });
  await rename(tempAbs, videoAbs);
}

export async function shippingCopy(videoAbs: string): Promise<string> {
  const copy = `${videoAbs}.ship.mp4`;
  await copyFile(videoAbs, copy);
  return copy;
}
