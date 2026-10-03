import { createHash } from "crypto";
import { spawn } from "child_process";
import { ffmpegBin } from "@/lib/ffmpeg";

/** Same first half-second of voice means the same recording, even if the file name changed. */
export function sameTake(a: string, b: string): boolean {
  return a.length > 8 && a === b;
}

export function takePrint(file: string): Promise<string> {
  return new Promise((resolve) => {
    const child = spawn(ffmpegBin(), [
      "-v",
      "error",
      "-i",
      file,
      "-t",
      "0.6",
      "-vn",
      "-ac",
      "1",
      "-ar",
      "8000",
      "-f",
      "s16le",
      "pipe:1",
    ]);
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk) => {
      chunks.push(Buffer.from(chunk));
    });
    child.on("error", () => resolve(""));
    child.on("close", (code) => {
      if (code !== 0) {
        resolve("");
        return;
      }
      const bytes = Buffer.concat(chunks);
      if (bytes.length < 800) {
        resolve("");
        return;
      }
      resolve(createHash("sha256").update(bytes).digest("hex"));
    });
  });
}

export async function bodyCtaClash(
  bodies: Array<{ path: string }>,
  ctas: Array<{ path: string }>,
  print: (file: string) => Promise<string> = takePrint,
): Promise<boolean> {
  const bodyPrints = await Promise.all(bodies.map((clip) => print(clip.path)));
  const ctaPrints = await Promise.all(ctas.map((clip) => print(clip.path)));
  return bodyPrints.some((body) => ctaPrints.some((cta) => sameTake(body, cta)));
}
