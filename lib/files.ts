import { createReadStream, createWriteStream } from "fs";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { once } from "events";
import { finished } from "stream/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { deleteR2, getR2, hasR2, putR2, type SavedFile } from "@/lib/r2";

export const REFERENCE_MAX_BYTES = 40 * 1024 * 1024;
export const UPLOAD_ROOT = process.env.UPLOAD_ROOT || path.join(process.cwd(), "data", "uploads");

export function localRoot(): string {
  return hasR2() ? path.join(os.tmpdir(), "studio-work") : UPLOAD_ROOT;
}

export type LocalUpload = { relative: string; absolute: string; mime: string; size: number };

/** Writes an upload to the working folder only (no R2). Ingest steps run on this before it is stored. */
export async function saveLocalUpload(file: File, folder: string): Promise<LocalUpload> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const relative = path.join(folder, `${randomUUID()}-${safeName}`).replace(/\\/g, "/");
  const absolute = path.join(localRoot(), relative);
  const bytes = Buffer.from(await file.arrayBuffer());
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, bytes);
  return { relative, absolute, mime: file.type || mimeFromName(file.name), size: bytes.length };
}

/** Writes a download to disk in pieces, then stores it. The whole video never sits in memory. */
export async function saveStreamedFile(
  body: ReadableStream<Uint8Array>,
  folder: string,
  filename: string,
  mime: string,
  maxBytes: number,
): Promise<SavedFile | null> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_") || "export.mp4";
  const relative = path.join(folder, `${randomUUID()}-${safeName}`).replace(/\\/g, "/");
  const absolute = path.join(UPLOAD_ROOT, relative);
  await mkdir(path.dirname(absolute), { recursive: true });
  const out = createWriteStream(absolute);
  const reader = body.getReader();
  let size = 0;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        out.destroy();
        await rm(absolute, { force: true });
        return null;
      }
      if (!out.write(chunk.value)) await once(out, "drain");
    }
    out.end();
    await finished(out);
  } catch (error) {
    out.destroy();
    await rm(absolute, { force: true });
    throw error;
  }
  if (size <= 0) {
    await rm(absolute, { force: true });
    return null;
  }
  const publicUrl = hasR2() ? await putR2(relative, createReadStream(absolute), mime, size) : "";
  if (hasR2()) await rm(absolute, { force: true });
  return { filename, path: relative, mime, size, publicUrl };
}

export async function saveUpload(file: File, folder: string): Promise<SavedFile> {
  const local = await saveLocalUpload(file, folder);
  const publicUrl = await uploadLocalToR2(local.relative, local.mime);
  return { filename: file.name, path: local.relative, mime: local.mime, size: local.size, publicUrl };
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

export async function deleteUpload(relative: string): Promise<void> {
  const key = relative.replace(/\\/g, "/");
  if (hasR2()) {
    try {
      await deleteR2(key);
    } catch {
      /* gone from the bucket already */
    }
  }
  await rm(path.join(UPLOAD_ROOT, key), { force: true });
  if (hasR2()) await rm(path.join(localRoot(), key), { force: true });
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
