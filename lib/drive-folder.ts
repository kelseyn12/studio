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

/** Names in the public folder page. Subfolders stay folders. Files keep their ids. */
export function parseDriveFolderList(html: string): DriveEntry[] {
  const entries: DriveEntry[] = [];
  const seen = new Set<string>();
  const pattern =
    /id="entry-([^"]+)"[\s\S]*?aria-label="([^"]*)"[\s\S]*?class="flip-entry-title">([^<]*)<[\s\S]{0,400}?flip-entry-last-modified"><div>([^<]*)</g;
  for (const match of html.matchAll(pattern)) {
    const id = match[1];
    if (!id || seen.has(id)) continue;
    seen.add(id);
    entries.push({
      id,
      name: decodeName(match[3] || ""),
      folder: match[2] === "Folder",
      modified: decodeName(match[4] || ""),
    });
  }
  return entries;
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
