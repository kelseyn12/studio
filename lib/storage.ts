import { REFERENCE_MAX_BYTES } from "@/lib/files";

export const STUDIO_FILE_MAX_BYTES = 250 * 1024 * 1024;
export const FREE_R2_BYTES = 10 * 1024 * 1024 * 1024;
export const WARN_R2_BYTES = 8 * 1024 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}

export function studioUsage(totalBytes: number) {
  return {
    bytes: totalBytes,
    label: formatBytes(totalBytes),
    of: formatBytes(FREE_R2_BYTES),
    hot: totalBytes >= WARN_R2_BYTES,
    full: totalBytes >= FREE_R2_BYTES,
  };
}

export function rejectStudioFile(size: number, kind: string): string | null {
  if (size <= 0) return "Missing file";
  if (kind === "REFERENCE" || kind === "VOICE") {
    if (size > REFERENCE_MAX_BYTES) return "Voice and references stay under 40MB. 4K days go in Drive.";
    return null;
  }
  if (size > STUDIO_FILE_MAX_BYTES) {
    return "That file is a camera day. Paste a Drive folder on Clips. Studio only keeps phone clips and finished videos.";
  }
  return null;
}
