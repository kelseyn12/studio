import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import path from "path";
import { UPLOAD_ROOT } from "@/lib/files";

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

export const HOOK_FONT =
  process.env.HOOK_FONT || "/System/Library/Fonts/Supplemental/Arial Bold.ttf";

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
  const outputAbs = path.join(UPLOAD_ROOT, outputRel);
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
  hookText?: string;
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
  if (input.speed !== 1) parts.push(`setpts=PTS/${input.speed}`);
  if (input.saturation !== 1 || input.contrast !== 1 || input.hue !== 0) {
    parts.push(`eq=saturation=${input.saturation}:contrast=${input.contrast}`);
    if (input.hue !== 0) parts.push(`hue=h=${input.hue}`);
  }
  if (input.hookText) {
    const text = escapeDrawText(input.hookText.slice(0, 80));
    parts.push(
      `drawtext=fontfile=${HOOK_FONT}:text='${text}':fontsize=56:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h*0.12`,
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
}): string {
  return videoFilter(input);
}

export async function assembleVideo(input: {
  clips: Array<{ path: string; hookText?: string }>;
  outputName: string;
  speed: number;
  saturation: number;
  contrast: number;
  hue: number;
  crop: number;
  musicPath?: string;
}): Promise<string> {
  await mkdir(path.join(UPLOAD_ROOT, "generated"), { recursive: true });
  const outputRel = path.join("generated", input.outputName);
  const outputAbs = path.join(UPLOAD_ROOT, outputRel);
  const n = input.clips.length;
  if (n === 0) throw new Error("No clips to assemble");

  const audioFlags = await Promise.all(input.clips.map((clip) => clipHasAudio(clip.path)));
  const args: string[] = [];
  for (const clip of input.clips) args.push("-i", clip.path);
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
      hookText: index === 0 ? input.clips[index].hookText : undefined,
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
