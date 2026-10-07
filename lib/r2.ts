import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";

export type SavedFile = {
  filename: string;
  path: string;
  mime: string;
  size: number;
  publicUrl: string;
};

export function hasR2(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
}

function client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });
}

/** True when a stored URL is something a browser or Outstand can GET without S3 signing. */
export function isPublicMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    if (parsed.hostname.endsWith("r2.cloudflarestorage.com")) return false;
    return true;
  } catch {
    return false;
  }
}

export function r2PublicUrl(key: string): string {
  const base = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
  if (!base || base.includes("r2.cloudflarestorage.com")) return "";
  return `${base}/${key}`;
}

export async function putR2(key: string, body: Buffer | Readable, mime: string, size?: number): Promise<string> {
  const contentLength = size ?? (Buffer.isBuffer(body) ? body.length : undefined);
  await client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: mime,
      ContentLength: contentLength,
    }),
  );
  return r2PublicUrl(key);
}

export async function getR2(key: string): Promise<Buffer> {
  const out = await client().send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    }),
  );
  const bytes = await out.Body?.transformToByteArray();
  return Buffer.from(bytes || []);
}

export async function deleteR2(key: string): Promise<void> {
  await client().send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    }),
  );
}
