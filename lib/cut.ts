import { mkdir } from "fs/promises";
import path from "path";
import { isPlayableCut, parseSpeed, type TimeRange } from "@/lib/cut-math";
import { clipHasAudio, runFfmpeg } from "@/lib/ffmpeg";
import { localRoot } from "@/lib/files";
import { trimVideo } from "@/lib/trim";

function encodeArgs(outputAbs: string): string[] {
  return [
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
  ];
}

/** Drops marked ranges, stitches what is left, then speeds the whole file. */
export async function cutVideo(input: {
  sourceAbs: string;
  outputRel: string;
  ranges: TimeRange[];
  speed: number;
}): Promise<string> {
  const speed = parseSpeed(input.speed);
  if (!isPlayableCut(input.ranges)) throw new Error("Nothing left to keep");
  if (input.ranges.length === 1 && speed === 1) {
    return trimVideo({
      sourceAbs: input.sourceAbs,
      outputRel: input.outputRel,
      start: input.ranges[0].start,
      end: input.ranges[0].end,
    });
  }

  const outputAbs = path.join(localRoot(), input.outputRel);
  await mkdir(path.dirname(outputAbs), { recursive: true });
  const args: string[] = [];
  for (const range of input.ranges) {
    if (range.start > 0) args.push("-ss", range.start.toFixed(2));
    args.push("-t", (range.end - range.start).toFixed(2), "-i", input.sourceAbs);
  }

  const hasAudio = await clipHasAudio(input.sourceAbs);
  const count = input.ranges.length;
  const chains: string[] = [];
  for (let index = 0; index < count; index += 1) {
    chains.push(`[${index}:v]fps=30,setsar=1,format=yuv420p[v${index}]`);
    if (hasAudio) chains.push(`[${index}:a]aresample=44100,aformat=channel_layouts=stereo[a${index}]`);
  }
  if (hasAudio) {
    const parts = Array.from({ length: count }, (_, index) => `[v${index}][a${index}]`).join("");
    chains.push(`${parts}concat=n=${count}:v=1:a=1[cv][ca]`);
  } else {
    const parts = Array.from({ length: count }, (_, index) => `[v${index}]`).join("");
    chains.push(`${parts}concat=n=${count}:v=1:a=0[cv]`);
  }
  if (speed !== 1) {
    chains.push(`[cv]setpts=PTS/${speed}[outv]`);
    if (hasAudio) chains.push(`[ca]atempo=${speed}[outa]`);
  }

  const video = speed === 1 ? "[cv]" : "[outv]";
  const audio = speed === 1 ? "[ca]" : "[outa]";
  args.push("-filter_complex", chains.join(";"));
  args.push("-map", video);
  if (hasAudio) args.push("-map", audio);
  args.push(...encodeArgs(outputAbs));
  await runFfmpeg(args);
  return input.outputRel;
}
