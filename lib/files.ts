import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { getR2, hasR2, putR2, type SavedFile } from "@/lib/r2";

export const REFERENCE_MAX_BYTES = 40 * 1024 * 1024;
export const UPLOAD_ROOT = process.env.UPLOAD_ROOT || path.join(process.cwd(), "data", "uploads");

export function localRoot(): string {
  return hasR2() ? path.join(os.tmpdir(), "studio-work") : UPLOAD_ROOT;
}

export async function saveUpload(file: File, folder: string): Promise<SavedFile> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${randomUUID()}-${safeName}`;
  const relative = path.join(folder, filename).replace(/\\/g, "/");
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "application/octet-stream";
  let publicUrl = "";
  if (hasR2()) {
    publicUrl = await putR2(relative, bytes, mime);
  } else {
    const absolute = path.join(UPLOAD_ROOT, relative);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, bytes);
  }
  return {
    filename: file.name,
    path: relative,
    mime,
    size: bytes.length,
    publicUrl,
  };
}

export async function uploadLocalToR2(relative: string, mime: string): Promise<string> {
  if (!hasR2()) return "";
  const bytes = await readFile(path.join(localRoot(), relative));
  return putR2(relative.replace(/\\/g, "/"), bytes, mime);
}

export async function ensureLocal(relative: string): Promise<string> {
  const absolute = path.join(localRoot(), relative);
  try {
    await readFile(absolute);
    return absolute;
  } catch {
    if (!hasR2()) throw new Error("Missing file");
    const bytes = await getR2(relative.replace(/\\/g, "/"));
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, bytes);
    return absolute;
  }
}

export function publicFileUrl(relative: string): string {
  return `/api/files/${relative.split(path.sep).join("/")}`;
}

export function mimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "mp4" || ext === "mov" || ext === "webm") return `video/${ext === "mp4" ? "mp4" : ext}`;
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "wav") return "audio/wav";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}

export function absoluteUpload(relative: string): string {
  return path.join(localRoot(), relative);
}
