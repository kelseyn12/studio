import { spawn } from "child_process";
import { accessSync, constants } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { localRoot } from "@/lib/files";
import { writeHookAss } from "@/lib/ass";
import type { DrawnStyle } from "@/lib/text-style";

const FFMPEG_FULL = "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg";
const FFPROBE_FULL = "/opt/homebrew/opt/ffmpeg-full/bin/ffprobe";

function exists(file: string): boolean {
  try {
    accessSync(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/** Homebrew's default `ffmpeg` dropped text. Prefer the full build, then PATH. */
export function ffmpegBin(): string {
  if (process.env.FFMPEG_BIN) return process.env.FFMPEG_BIN;
  if (process.platform === "darwin" && exists(FFMPEG_FULL)) return FFMPEG_FULL;
  return "ffmpeg";
}

export function ffprobeBin(): string {
  if (process.env.FFPROBE_BIN) return process.env.FFPROBE_BIN;
  if (process.platform === "darwin" && exists(FFPROBE_FULL)) return FFPROBE_FULL;
  return "ffprobe";
}

let burnTextKnown: boolean | null = null;

/** False when this ffmpeg cannot burn hook text or spoken captions. */
export async function canBurnText(): Promise<boolean> {
  if (burnTextKnown !== null) return burnTextKnown;
  try {
    const out = await runCommand(ffmpegBin(), ["-hide_banner", "-filters"]);
    burnTextKnown = out.includes(" drawtext ") && out.includes(" ass ");
  } catch {
    burnTextKnown = false;
  }
  return burnTextKnown;
}

export function runCommand(cmd: string, args: string[]): Promise<string> {
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
  process.env.HOOK_FONT ||
  (process.platform === "darwin"
    ? "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    : "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf");

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

export async function runFfmpeg(args: string[]): Promise<void> {
  await runCommand(ffmpegBin(), ["-y", ...args]);
}

export async function clipHasAudio(file: string): Promise<boolean> {
  try {
    const out = await runCommand(ffprobeBin(), [
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
    .replace(/[,;\[\]%]/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  hookFilter?: string;
  tintHue?: number | null;
  tintMix?: number;
  captionFilters?: string[];
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
  // Spoken captions go in before the speed change so their timing stays true.
  if (input.captionFilters?.length) parts.push(...input.captionFilters);
  if (input.speed !== 1) parts.push(`setpts=PTS/${input.speed}`);
  if (input.saturation !== 1 || input.contrast !== 1 || input.hue !== 0) {
    parts.push(`eq=saturation=${input.saturation}:contrast=${input.contrast}`);
    if (input.hue !== 0) parts.push(`hue=h=${input.hue}`);
  }
  // Color wash goes under the text so the words stay clean white.
  if (input.tintHue !== null && input.tintHue !== undefined && (input.tintMix ?? 0) > 0) {
    parts.push(tintFilter(input.tintHue, input.tintMix ?? DEFAULT_TINT_MIX));
  }
  if (input.hookFilter) parts.push(input.hookFilter);
  return parts.join(",");
}

const DEFAULT_TINT_MIX = 0.38;

/** Sasha's colored-light room: a translucent single-hue wash over the whole frame. `mix` 0–1 is the strength. */
export function tintFilter(hue: number, mix = DEFAULT_TINT_MIX): string {
  return `colorize=hue=${Math.round(hue)}:saturation=0.7:lightness=0.5:mix=${Math.min(Math.max(mix, 0), 1).toFixed(2)}`;
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
  clips: Array<{ path: string; hookText?: string; trim?: ClipTrim; captionFilters?: string[] }>;
  outputName: string;
  speed: number;
  saturation: number;
  contrast: number;
  hue: number;
  crop: number;
  mirror?: boolean;
  hookColor?: string;
  accentColor?: string;
  hookStyle?: DrawnStyle;
  hookList?: number;
  tintHue?: number | null;
  tintMix?: number;
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
  const hookText = input.clips[0]?.hookText;
  const hookFilter = hookText
    ? await writeHookAss({
        text: hookText,
        style: input.hookStyle ?? "plain",
        baseColor: input.hookColor,
        accentColor: input.accentColor,
        listCount: input.hookList,
      })
    : undefined;
  for (let index = 0; index < n; index += 1) {
    const vf = videoFilter({
      speed: input.speed,
      saturation: input.saturation,
      contrast: input.contrast,
      hue: input.hue,
      crop: input.crop,
      mirror: input.mirror,
      hookFilter: index === 0 ? hookFilter : undefined,
      tintHue: input.tintHue,
      tintMix: input.tintMix,
      captionFilters: input.clips[index].captionFilters,
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
