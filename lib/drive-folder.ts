export type DriveEntry = { id: string; name: string; folder: boolean; modified: string };

const VIDEO_NAME = /\.(mp4|mov|m4v|webm)$/i;

/** The id in a Google Drive folder link. A file link is not a folder. */
export function driveFolderId(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    return url.pathname.match(/\/folders\/([^/?#]+)/)?.[1] ?? null;
  } catch {
    return null;
  }
}

function decodeName(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

/** Names in the public folder page. A video row has no Folder label. Subfolders stay folders. */
export function parseDriveFolderList(html: string): DriveEntry[] {
  const entries: DriveEntry[] = [];
  const seen = new Set<string>();
  const pattern = /id="entry-([^"]+)"([\s\S]*?)(?=id="entry-|<\/body>|$)/g;
  for (const match of html.matchAll(pattern)) {
    const id = match[1];
    const block = match[2] || "";
    if (!id || seen.has(id)) continue;
    const name = decodeName(block.match(/class="flip-entry-title">([^<]*)</)?.[1] || "");
    if (!name) continue;
    seen.add(id);
    const folder = /aria-label="Folder"/.test(block) || /\/folders\//.test(block);
    entries.push({
      id,
      name,
      folder,
      modified: decodeName(block.match(/flip-entry-last-modified"><div>([^<]*)</)?.[1] || ""),
    });
  }
  return entries;
}

/** The download that skips Google's "too big to scan" page. */
export function driveFileDownloadUrl(fileId: string): string {
  const params = new URLSearchParams({ id: fileId, export: "download", confirm: "t" });
  return `https://drive.usercontent.google.com/download?${params}`;
}

function modifiedTime(value: string, now: Date): number {
  const text = value.trim();
  if (!text) return 0;
  if (/am|pm/i.test(text) && !/\d{4}/.test(text)) {
    const parsed = Date.parse(`${now.getFullYear()} ${text}`);
    return Number.isNaN(parsed) ? now.getTime() : parsed;
  }
  const withYear = /^[A-Za-z]{3}\s+\d{1,2}$/.test(text) ? `${text}, ${now.getFullYear()}` : text;
  const parsed = Date.parse(withYear);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Any video he added in that folder. Raw folders are skipped. The newest video wins. */
export function finishedDriveFile(entries: DriveEntry[], now = new Date()): DriveEntry | null {
  const videos = entries.filter((entry) => !entry.folder && VIDEO_NAME.test(entry.name));
  return [...videos].sort((left, right) => modifiedTime(right.modified, now) - modifiedTime(left.modified, now))[0] ?? null;
}
