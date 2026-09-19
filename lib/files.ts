import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");

export async function saveUpload(file: File, folder: string): Promise<{
  filename: string;
  path: string;
  mime: string;
  size: number;
}> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${randomUUID()}-${safeName}`;
  const relative = path.join(folder, filename);
  const absolute = path.join(UPLOAD_ROOT, relative);
  await mkdir(path.dirname(absolute), { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absolute, bytes);
  return {
    filename: file.name,
    path: relative,
    mime: file.type || "application/octet-stream",
    size: bytes.length,
  };
}

export function publicFileUrl(relative: string): string {
  return `/api/files/${relative.split(path.sep).join("/")}`;
}

export function absoluteUpload(relative: string): string {
  return path.join(UPLOAD_ROOT, relative);
}
