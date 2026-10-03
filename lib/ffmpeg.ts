import { spawn } from "child_process";
import { accessSync, constants } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { localRoot } from "@/lib/files";
import { hookEmojiSpots, writeHookAss, type HookAssInput } from "@/lib/ass";
import { chainOverlays, emojiArtFor, emojiOverlayFilter, emojiPrepFilter, type EmojiArt, type OverlayStage } from "@/lib/emoji-overlay";
import { logoOverlayFilter } from "@/lib/hook-logos-math";
import { sharedListPlan, type Box } from "@/lib/list-layout";
import { musicMixFilter } from "@/lib/output-recipe";
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

export const HOOK_FONT =
  process.env.HOOK_FONT ||
  (process.platform === "darwin"
    ? "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    : "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf");

/** Window kept from a clip; `end: null` means play to the end. */
export type ClipTrim = { start: number; end: number | null };

export const NO_TRIM: ClipTrim = { start: 0, end: null };

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

export async function writeThumb(inputAbs: string, outputRel: string, at = 0): Promise<string> {
  const outputAbs = path.join(localRoot(), outputRel);
  await mkdir(path.dirname(outputAbs), { recursive: true });
  const seek = at > 0.05 ? ["-ss", at.toFixed(3)] : [];
  await runFfmpeg(["-i", inputAbs, ...seek, "-vframes", "1", "-q:v", "2", outputAbs]);
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
  captionFilters?: string[];
}): string {
  const crop = Math.max(0, input.crop);
  const width = Math.round(1080 * (1 + crop / 100));
  const height = Math.round(1920 * (1 + crop / 100));
  const parts = [
    `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos`,
    "crop=1080:1920",
    "setsar=1",
  ];
  if (input.mirror) parts.push("hflip");
  // Spoken captions go in before the speed change so their timing stays true.
  if (input.captionFilters?.length) parts.push(...input.captionFilters);
  parts.push("fps=30");
  if (input.speed !== 1) parts.push(`setpts=(PTS-STARTPTS)/${input.speed}`);
  if (input.saturation !== 1 || input.contrast !== 1 || input.hue !== 0) {
    parts.push(`eq=saturation=${input.saturation}:contrast=${input.contrast}`);
    if (input.hue !== 0) parts.push(`hue=h=${input.hue}`);
  }
  if (input.hookFilter) parts.push(input.hookFilter);
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
  clips: Array<{
    path: string;
    hookText?: string;
    trim?: ClipTrim;
    captionFilters?: string[];
    hookX?: number;
    hookY?: number;
    listItems?: string[];
    listAt?: number[];
    textFrom?: number;
    textTo?: number;
    box?: boolean | "white";
  }>;
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
  musicPath?: string;
  musicStart?: number;
  /** 0–3. Voice stays full. Every step keeps the song under it. */
  musicLevel?: number;
  logoPath?: string;
  /** Logo row boxes the first clip's headline keeps clear of. */
  avoid?: Box[];
  hookX?: number;
  hookY?: number;
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
  const logoIndex = input.logoPath ? n : -1;
  if (input.logoPath) args.push("-i", input.logoPath);

  const look = input.hookStyle ?? "plain";
  const hook = input.clips[0];
  const { count: listCount, stack } = sharedListPlan({
    style: look,
    headline: hook?.hookText || "",
    x: hook?.hookX ?? input.hookX,
    y: hook?.hookY ?? input.hookY,
    hookList: input.hookList,
    itemCounts: input.clips.map((row) => row.listItems?.length ?? 0),
  });
  const assInputs = input.clips.map((clip, index): HookAssInput | undefined => {
    const showList = (index === 0 && listCount > 0) || Boolean(clip.listItems?.length);
    if (!clip.hookText && !showList) return undefined;
    return {
      text: clip.hookText || "",
      style: look,
      baseColor: input.hookColor,
      accentColor: input.accentColor,
      listCount: showList ? listCount : 0,
      listItems: clip.listItems,
      listAt: clip.listAt,
      listStack: stack,
      box: clip.box,
      x: clip.hookX ?? (index === 0 ? input.hookX : undefined),
      y: clip.hookY ?? (index === 0 ? input.hookY : undefined),
      from: clip.textFrom,
      to: clip.textTo,
      ...(index === 0 && input.avoid?.length ? { avoid: input.avoid } : {}),
    };
  });
  // Colour emoji in headlines ride on top of the ASS text as PNG inputs, one per emoji.
  const arts = await Promise.all(assInputs.map((ass) => (ass ? emojiArtFor(hookEmojiSpots(ass)) : null)));
  const artInputIndex = new Map<EmojiArt, number>();
  for (const art of arts.flatMap((list) => list ?? [])) {
    artInputIndex.set(art, n + (input.logoPath ? 1 : 0) + artInputIndex.size);
    args.push("-i", art.file);
  }
  args.push("-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100");
  if (input.musicPath) args.push("-i", input.musicPath);
  const silentIndex = n + (input.logoPath ? 1 : 0) + artInputIndex.size;
  const musicIndex = input.musicPath ? silentIndex + 1 : -1;
  const tempo = input.speed !== 1 ? `atempo=${input.speed},` : "";

  const chains: string[] = [];
  for (let index = 0; index < n; index += 1) {
    const clip = input.clips[index];
    const ass = assInputs[index];
    const art = arts[index] ?? [];
    const hookFilter = ass ? await writeHookAss({ ...ass, emojiArt: art.length > 0 }) : undefined;
    const vf = videoFilter({
      speed: input.speed,
      saturation: input.saturation,
      contrast: input.contrast,
      hue: input.hue,
      crop: input.crop,
      mirror: input.mirror,
      hookFilter,
      captionFilters: clip.captionFilters,
    });
    // Overlay stages after the text: each emoji's colour art, then the logo row (first clip) on top.
    const stages: OverlayStage[] = art.map((spot, k) => {
      const label = `emoji${index}_${k}`;
      return {
        prep: emojiPrepFilter(artInputIndex.get(spot) ?? 0, spot, label),
        overlay: (from, to) => emojiOverlayFilter(from, label, to, spot, clip.textFrom, clip.textTo),
      };
    });
    if (index === 0 && logoIndex >= 0) {
      stages.push({ prep: `[${logoIndex}:v]format=rgba[logo]`, overlay: (from, to) => logoOverlayFilter(from, "logo", to) });
    }
    chains.push(...chainOverlays(`[${index}:v]${vf}`, `v${index}`, stages));
    if (audioFlags[index]) {
      chains.push(`[${index}:a]${tempo}aresample=44100,aformat=channel_layouts=stereo[a${index}]`);
    } else {
      chains.push(`[${silentIndex}:a]${tempo}aformat=channel_layouts=stereo,atrim=0:8[a${index}]`);
    }
  }
  const concatIn = Array.from({ length: n }, (_, index) => `[v${index}][a${index}]`).join("");
  chains.push(`${concatIn}concat=n=${n}:v=1:a=1[outv][outa]`);
  if (input.musicPath && musicIndex >= 0) {
    chains.push(musicMixFilter(musicIndex, input.musicStart ?? 0, input.musicLevel ?? 1));
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
    "-use_editlist",
    "0",
    "-avoid_negative_ts",
    "make_zero",
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
