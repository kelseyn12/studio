export type DriveEntry = { id: string; name: string; folder: boolean };

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
  const pattern = /id="entry-([^"]+)"[\s\S]*?aria-label="([^"]*)"[\s\S]*?class="flip-entry-title">([^<]*)</g;
  for (const match of html.matchAll(pattern)) {
    const id = match[1];
    if (!id || seen.has(id)) continue;
    seen.add(id);
    entries.push({ id, name: decodeName(match[3] || ""), folder: match[2] === "Folder" });
  }
  return entries;
}

/** The finished cut sits in the same folder as the raw clips. Its name says finished. */
export function finishedDriveFile(entries: DriveEntry[]): DriveEntry | null {
  return (
    entries.find((entry) => !entry.folder && VIDEO_NAME.test(entry.name) && /finished/i.test(entry.name)) ?? null
  );
}
