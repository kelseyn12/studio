import { driveFileDownloadUrl, driveFolderId } from "@/lib/drive-folder";

/** A pasted Drive link. A file link is the video. A folder link is a folder that holds it. */
export function driveLinkKind(raw: string): "file" | "folder" | null {
  if (driveFileId(raw)) return "file";
  if (driveFolderId(raw)) return "folder";
  return null;
}

/** The file id in a Drive file link. A folder link has none. */
export function driveFileId(value: string): string | null {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    const host = parsed.hostname;
    if (host !== "drive.google.com" && host !== "docs.google.com" && host !== "drive.usercontent.google.com") return null;
    if (parsed.pathname.includes("/folders/")) return null;
    const fromPath = parsed.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
    return fromPath || parsed.searchParams.get("id");
  } catch {
    return null;
  }
}

/** A finished-file URL. A Drive folder is rejected. A Drive file link becomes the download URL. */
export function directMediaUrl(value: string): string | null {
  const fileId = driveFileId(value);
  if (fileId) return driveFileDownloadUrl(fileId);
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    const host = parsed.hostname;
    if (host === "drive.google.com" || host === "docs.google.com" || host === "drive.usercontent.google.com") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isDirectMediaUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const host = parsed.hostname;
    if (host.endsWith("drive.google.com") && !parsed.pathname.includes("/uc")) return false;
    return true;
  } catch {
    return false;
  }
}
