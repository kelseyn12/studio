import { mkdir } from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { MIN_CLIP_SECONDS } from "@/lib/cut-math";
import { ffmpegBin, ffprobeBin, NO_TRIM, runCommand, runFfmpeg, type ClipTrim } from "@/lib/ffmpeg";
import { localRoot } from "@/lib/files";

export { MIN_CLIP_SECONDS };

/** Cutting clips: hand trims from the Quick cut tool and dead-air trims found with silencedetect. */

function runForStderr(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "pipe" });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stderr);
      else reject(new Error(stderr.slice(-900) || `${cmd} exited ${code}`));
    });
  });
}

/** Quiet below this counts as dead air. */
const SILENCE_NOISE_DB = -35;
/** Dead air must last this long (seconds) before we trim it. */
const SILENCE_MIN_SECONDS = 0.3;
/** Silence touching the first/last tenth of a second counts as an edge. */
const SILENCE_EDGE_SECONDS = 0.1;
/** Breathing room kept around the cut (seconds). */
const TRIM_PAD_SECONDS = 0.05;
/** A hand cut must keep at least MIN_CLIP_SECONDS of video. */
export function isValidCut(start: number, end: number): boolean {
  return Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end - start >= MIN_CLIP_SECONDS;
}

/** Re-encodes one file down to the picked window. Returns the output path. */
export async function trimVideo(input: {
  sourceAbs: string;
  outputRel: string;
  start: number;
  end: number;
}): Promise<string> {
  const outputAbs = path.join(localRoot(), input.outputRel);
  await mkdir(path.dirname(outputAbs), { recursive: true });
  const args: string[] = [];
  if (input.start > 0) args.push("-ss", input.start.toFixed(2));
  args.push("-t", (input.end - input.start).toFixed(2), "-i", input.sourceAbs);
  args.push(
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
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    outputAbs,
  );
  await runFfmpeg(args);
  return input.outputRel;
}

/** Turns ffmpeg silencedetect log lines into a safe start/end trim for one clip. */
export function trimFromSilence(log: string, duration: number): ClipTrim {
  const starts = [...log.matchAll(/silence_start: (-?[\d.]+)/g)].map((match) => Number(match[1]));
  const ends = [...log.matchAll(/silence_end: (-?[\d.]+)/g)].map((match) => Number(match[1]));
  let start = 0;
  let end: number | null = null;
  if (starts.length && starts[0] <= SILENCE_EDGE_SECONDS && ends.length) {
    start = Math.max(0, ends[0] - TRIM_PAD_SECONDS);
  }
  if (starts.length) {
    const lastStart = starts[starts.length - 1];
    const lastEnd = ends.length >= starts.length ? ends[ends.length - 1] : null;
    const runsToEnd = lastEnd === null || lastEnd >= duration - SILENCE_EDGE_SECONDS;
    if (lastStart > start && runsToEnd) {
      end = Math.min(duration, lastStart + TRIM_PAD_SECONDS);
    }
  }
  const keptSeconds = (end ?? duration) - start;
  if (keptSeconds < MIN_CLIP_SECONDS) return NO_TRIM;
  if (start === 0 && end === null) return NO_TRIM;
  return { start, end };
}

export async function clipDuration(file: string): Promise<number> {
  const out = await runCommand(ffprobeBin(), [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "csv=p=0",
    file,
  ]);
  return Number(out.trim()) || 0;
}

/** Finds dead air at the start and end of a clip. Returns NO_TRIM when unsure. */
export async function quietEnds(file: string): Promise<ClipTrim> {
  try {
    const [log, duration] = await Promise.all([
      runForStderr(ffmpegBin(), [
        "-i",
        file,
        "-af",
        `silencedetect=noise=${SILENCE_NOISE_DB}dB:d=${SILENCE_MIN_SECONDS}`,
        "-f",
        "null",
        "-",
      ]),
      clipDuration(file),
    ]);
    if (!duration) return NO_TRIM;
    return trimFromSilence(log, duration);
  } catch {
    return NO_TRIM;
  }
}
