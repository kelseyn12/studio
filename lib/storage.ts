import { REFERENCE_MAX_BYTES } from "@/lib/files";

/** Per-file cap for phone clips and finished videos. 1GB on a Mac (4K phone clips
 * land here and get shrunk to 1080 on arrival); fly.toml pins Fly to 250MB. */
const DEFAULT_FILE_MAX_MB = 1024;
export const STUDIO_FILE_MAX_BYTES = fileMaxBytes(process.env.STUDIO_FILE_MAX_MB);

export function fileMaxBytes(configuredMb: string | undefined): number {
  const mb = Number(configuredMb);
  return (Number.isFinite(mb) && mb > 0 ? mb : DEFAULT_FILE_MAX_MB) * 1024 * 1024;
}
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
    return `That file is over ${formatBytes(STUDIO_FILE_MAX_BYTES)}. Cut it into shorter takes on your phone, or paste a Drive folder on Clips for a whole camera day.`;
  }
  return null;
}
