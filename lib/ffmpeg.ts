import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import path from "path";
import { UPLOAD_ROOT } from "@/lib/files";

export function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-y", ...args], { stdio: "pipe" });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.slice(-800) || `ffmpeg exited ${code}`));
    });
  });
}

export async function concatClips(input: {
  clips: string[];
  outputName: string;
  speedOn: boolean;
  colorOn: boolean;
  zoomOn: boolean;
  intensity: string;
}): Promise<string> {
  const folder = path.join(UPLOAD_ROOT, "generated");
  await mkdir(folder, { recursive: true });
  const outputRel = path.join("generated", input.outputName);
  const outputAbs = path.join(UPLOAD_ROOT, outputRel);
  const hue = input.intensity === "hard" ? 18 : 8;
  const speed = input.speedOn ? 1.03 : 1;
  const filters: string[] = [];
  if (input.speedOn) filters.push(`setpts=PTS/${speed}`);
  if (input.colorOn) filters.push(`hue=s=${1 + hue / 40}:h=${hue}`);
  if (input.zoomOn) filters.push("scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920");
  else filters.push("scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2");
  const filter = filters.join(",");
  const args: string[] = [];
  for (const clip of input.clips) args.push("-i", clip);
  const n = input.clips.length;
  const concat = Array.from({ length: n }, (_, index) => `[${index}:v]${filter}[v${index}];`).join("");
  const join = `${Array.from({ length: n }, (_, index) => `[v${index}]`).join("")}concat=n=${n}:v=1:a=0[outv]`;
  args.push("-filter_complex", `${concat}${join}`, "-map", "[outv]", "-an", outputAbs);
  await runFfmpeg(args);
  return outputRel;
}
