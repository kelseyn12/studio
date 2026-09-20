import { mkdtemp, readdir, readFile, rm } from "fs/promises";
import { spawn } from "child_process";
import os from "os";
import path from "path";
import { REFERENCE_MAX_BYTES, mimeFromName } from "@/lib/files";
import { isDirectMediaUrl } from "@/lib/media-url";

const PAGE_HOSTS = ["tiktok.com", "instagram.com", "youtube.com", "youtu.be", "x.com", "twitter.com", "vm.tiktok.com"];

export function mediaUrlAllowed(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host === "0.0.0.0") return false;
    if (host === "::1" || host.startsWith("[") ) return false;
    if (/^(10|127|169\.254|192\.168|172\.(1[6-9]|2\d|3[0-1]))\./.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

export function isPageMediaUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    return PAGE_HOSTS.some((item) => host === item || host.endsWith(`.${item}`));
  } catch {
    return false;
  }
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "pipe",
      env: { ...process.env, PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ""}` },
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.slice(-400) || `${cmd} exited ${code}`));
    });
  });
}

async function pullDirect(url: string): Promise<File> {
  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(45_000) });
  if (!response.ok) throw new Error("Could not fetch that file");
  if (!mediaUrlAllowed(response.url)) throw new Error("That link is not allowed");
  const length = Number(response.headers.get("content-length") || 0);
  if (length > REFERENCE_MAX_BYTES) throw new Error("File is too big. Under 40MB.");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > REFERENCE_MAX_BYTES) throw new Error("File is too big. Under 40MB.");
  const name = new URL(response.url).pathname.split("/").pop() || "audio.mp4";
  const type = response.headers.get("content-type") || mimeFromName(name);
  return new File([new Uint8Array(bytes)], name, { type });
}

async function pullWithYtdlp(url: string): Promise<File> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "studio-yt-"));
  try {
    await run("yt-dlp", [
      "--no-playlist",
      "--max-filesize",
      "40M",
      "-f",
      "bestaudio/best",
      "-o",
      path.join(dir, "media.%(ext)s"),
      url,
    ]);
    const name = (await readdir(dir)).find((item) => item.startsWith("media.")) || "";
    if (!name) throw new Error("Download made no file");
    const bytes = await readFile(path.join(dir, name));
    if (bytes.length > REFERENCE_MAX_BYTES) throw new Error("File is too big. Under 40MB.");
    return new File([new Uint8Array(bytes)], name, { type: mimeFromName(name) });
  } catch (error) {
    const missing = error instanceof Error && "code" in error && error.code === "ENOENT";
    if (missing || (error instanceof Error && error.message.includes("ENOENT"))) {
      throw new Error("Install yt-dlp (brew install yt-dlp) or upload the file.");
    }
    throw error;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function pullMedia(url: string): Promise<File> {
  if (!mediaUrlAllowed(url)) throw new Error("That link is not allowed");
  if (isPageMediaUrl(url)) return pullWithYtdlp(url);
  if (!isDirectMediaUrl(url)) throw new Error("Need a video/audio URL or a TikTok / Reel / YouTube link");
  return pullDirect(url);
}
