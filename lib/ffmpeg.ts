import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import path from "path";
import { localRoot } from "@/lib/files";

function runCommand(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "pipe" });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr.slice(-900) || `${cmd} exited ${code}`));
    });
  });
}

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

export const HOOK_FONT =
  process.env.HOOK_FONT || "/System/Library/Fonts/Supplemental/Arial Bold.ttf";

/** Quiet below this counts as dead air. */
const SILENCE_NOISE_DB = -35;
/** Dead air must last this long (seconds) before we trim it. */
const SILENCE_MIN_SECONDS = 0.3;
/** Silence touching the first/last tenth of a second counts as an edge. */
const SILENCE_EDGE_SECONDS = 0.1;
/** Breathing room kept around the cut (seconds). */
const TRIM_PAD_SECONDS = 0.05;
/** Never trim a clip below this length (seconds). */
export const MIN_CLIP_SECONDS = 0.5;

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

export type ClipTrim = { start: number; end: number | null };

export const NO_TRIM: ClipTrim = { start: 0, end: null };

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
  const out = await runCommand("ffprobe", [
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
      runForStderr("ffmpeg", [
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

export async function runFfmpeg(args: string[]): Promise<void> {
  await runCommand("ffmpeg", ["-y", ...args]);
}

export async function clipHasAudio(file: string): Promise<boolean> {
  try {
    const out = await runCommand("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "a",
      "-show_entries",
      "stream=index",
      "-of",
      "csv=p=0",
      file,
    ]);
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

export function escapeDrawText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\u2019")
    .replace(/\n/g, " ");
}

export async function writeThumb(inputAbs: string, outputRel: string): Promise<string> {
  const outputAbs = path.join(localRoot(), outputRel);
  await mkdir(path.dirname(outputAbs), { recursive: true });
  await runFfmpeg(["-i", inputAbs, "-vframes", "1", "-q:v", "3", outputAbs]);
  return outputRel;
}

function videoFilter(input: {
  speed: number;
  saturation: number;
  contrast: number;
  hue: number;
  crop: number;
  mirror?: boolean;
  hookText?: string;
  hookColor?: string;
}): string {
  const crop = Math.max(0, input.crop);
  const width = Math.round(1080 * (1 + crop / 100));
  const height = Math.round(1920 * (1 + crop / 100));
  const parts = [
    `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos`,
    "crop=1080:1920",
    "fps=30",
    "setsar=1",
  ];
  if (input.mirror) parts.push("hflip");
  if (input.speed !== 1) parts.push(`setpts=PTS/${input.speed}`);
  if (input.saturation !== 1 || input.contrast !== 1 || input.hue !== 0) {
    parts.push(`eq=saturation=${input.saturation}:contrast=${input.contrast}`);
    if (input.hue !== 0) parts.push(`hue=h=${input.hue}`);
  }
  if (input.hookText) {
    const text = escapeDrawText(input.hookText.slice(0, 80));
    const color = input.hookColor || "white";
    parts.push(
      `drawtext=fontfile=${HOOK_FONT}:text='${text}':fontsize=56:fontcolor=${color}:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h*0.12`,
    );
  }
  return parts.join(",");
}

export function uniquenessFilter(input: {
  speed: number;
  saturation: number;
  contrast: number;
  hue: number;
  crop: number;
  mirror?: boolean;
}): string {
  return videoFilter(input);
}

export async function assembleVideo(input: {
  clips: Array<{ path: string; hookText?: string; trim?: ClipTrim }>;
  outputName: string;
  speed: number;
  saturation: number;
  contrast: number;
  hue: number;
  crop: number;
  mirror?: boolean;
  hookColor?: string;
  musicPath?: string;
}): Promise<string> {
  await mkdir(path.join(localRoot(), "generated"), { recursive: true });
  const outputRel = path.join("generated", input.outputName);
  const outputAbs = path.join(localRoot(), outputRel);
  const n = input.clips.length;
  if (n === 0) throw new Error("No clips to assemble");

  const audioFlags = await Promise.all(input.clips.map((clip) => clipHasAudio(clip.path)));
  const args: string[] = [];
  for (const clip of input.clips) {
    const trim = clip.trim ?? NO_TRIM;
    if (trim.start > 0) args.push("-ss", trim.start.toFixed(2));
    if (trim.end !== null) args.push("-t", (trim.end - trim.start).toFixed(2));
    args.push("-i", clip.path);
  }
  args.push("-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100");
  if (input.musicPath) args.push("-i", input.musicPath);
  const silentIndex = n;
  const musicIndex = input.musicPath ? n + 1 : -1;

  const tempo = input.speed !== 1 ? `atempo=${input.speed},` : "";
  const chains: string[] = [];
  for (let index = 0; index < n; index += 1) {
    const vf = videoFilter({
      speed: input.speed,
      saturation: input.saturation,
      contrast: input.contrast,
      hue: input.hue,
      crop: input.crop,
      mirror: input.mirror,
      hookText: index === 0 ? input.clips[index].hookText : undefined,
      hookColor: input.hookColor,
    });
    chains.push(`[${index}:v]${vf}[v${index}]`);
    if (audioFlags[index]) {
      chains.push(`[${index}:a]${tempo}aresample=44100,aformat=channel_layouts=stereo[a${index}]`);
    } else {
      chains.push(`[${silentIndex}:a]${tempo}aformat=channel_layouts=stereo,atrim=0:8[a${index}]`);
    }
  }
  const concatIn = Array.from({ length: n }, (_, index) => `[v${index}][a${index}]`).join("");
  chains.push(`${concatIn}concat=n=${n}:v=1:a=1[outv][outa]`);
  if (input.musicPath && musicIndex >= 0) {
    chains.push(`[${musicIndex}:a]volume=0.22,aresample=44100[mus]`);
    chains.push(`[outa][mus]amix=inputs=2:duration=first:dropout_transition=2[mix]`);
  }
  args.push("-filter_complex", chains.join(";"));
  args.push("-map", "[outv]", "-map", input.musicPath ? "[mix]" : "[outa]");
  args.push(
    "-c:v",
    "libx264",
    "-preset",
    "medium",
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
    "-shortest",
    outputAbs,
  );
  await runFfmpeg(args);
  return outputRel;
}
