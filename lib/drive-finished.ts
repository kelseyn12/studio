import { after } from "next/server";
import { attachEditedSaved } from "@/lib/cut-ready";
import { needsChanges } from "@/lib/change-note";
import { driveCutIsNewer, driveFolderId, finishedDriveFile, parseDriveFolderList } from "@/lib/drive-folder";
import { mimeFromName, saveStreamedFile } from "@/lib/files";
import { directMediaUrl, driveFileId, driveLinkKind } from "@/lib/media-url";
import type { SavedFile } from "@/lib/r2";
import { STUDIO_FILE_MAX_BYTES } from "@/lib/storage";

const pulling = new Set<string>();

type PullCard = {
  id: string;
  rawsUrl: string;
  cutBy: string;
  status?: string;
  editorNote?: string;
  assets: Array<{ kind: string; createdAt?: Date }>;
};

function importedAt(card: PullCard): Date | null {
  const times = card.assets.filter((asset) => asset.kind === "EDITED" && asset.createdAt).map((asset) => asset.createdAt as Date);
  if (times.length === 0) return null;
  return times.sort((left, right) => right.getTime() - left.getTime())[0];
}

/** Look in the shared Drive folder after the page answers. One look at a time per video. */
export function scheduleDrivePull(card: PullCard): void {
  if (card.cutBy !== "EDITOR") return;
  if (!driveFolderId(card.rawsUrl)) return;
  const hasCut = card.assets.some((asset) => asset.kind === "EDITED");
  const fixing = needsChanges(card.status || "", card.editorNote || "");
  if (hasCut && !fixing) return;
  if (pulling.has(card.id)) return;
  pulling.add(card.id);
  const already = importedAt(card);
  after(async () => {
    try {
      await pullFinishedFromDrive(card.id, card.rawsUrl, already);
    } finally {
      pulling.delete(card.id);
    }
  });
}

function namedFile(header: string, fallback: string): string {
  const quoted = header.match(/filename="([^"]+)"/i)?.[1] || fallback;
  return quoted.includes(".") ? quoted : `${quoted}.mp4`;
}

async function downloadDriveFile(cardId: string, fileId: string, fallbackName: string): Promise<SavedFile | null> {
  const first = directMediaUrl(`https://drive.google.com/file/d/${fileId}/view`);
  if (!first) return null;
  const response = await fetch(first);
  const type = response.headers.get("content-type") || "";
  if (!response.ok || type.includes("text/html") || !response.body) return null;
  const length = Number(response.headers.get("content-length") || 0);
  if (length > STUDIO_FILE_MAX_BYTES) return null;
  const name = namedFile(response.headers.get("content-disposition") || "", fallbackName);
  return saveStreamedFile(response.body, `cards/${cardId}`, name, type || mimeFromName(name), STUDIO_FILE_MAX_BYTES);
}

async function newestInFolder(folderId: string): Promise<{ id: string; name: string } | null> {
  const listing = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}`);
  if (!listing.ok) return null;
  const file = finishedDriveFile(parseDriveFolderList(await listing.text()));
  return file ? { id: file.id, name: file.name } : null;
}

/** A Drive file link, or a Drive folder that has the video in it. Her folder or one he made. */
export async function attachDriveLink(cardId: string, rawUrl: string, textStyle: string, uploaderRole: string): Promise<boolean> {
  const kind = driveLinkKind(rawUrl);
  const picked =
    kind === "file"
      ? { id: driveFileId(rawUrl) || "", name: "export.mp4" }
      : kind === "folder"
        ? await newestInFolder(driveFolderId(rawUrl) || "")
        : null;
  if (!picked?.id) return false;
  const saved = await downloadDriveFile(cardId, picked.id, picked.name);
  if (!saved) return false;
  await attachEditedSaved(cardId, saved, textStyle, uploaderRole);
  return true;
}

/** Any video he added in the same folder as the raw clips. A newer one replaces the cut already in Studio. */
export async function pullFinishedFromDrive(cardId: string, rawsUrl: string, importedAt: Date | null = null): Promise<boolean> {
  const folderId = driveFolderId(rawsUrl);
  if (!folderId) return false;
  const listing = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}`);
  if (!listing.ok) return false;
  const file = finishedDriveFile(parseDriveFolderList(await listing.text()));
  if (!file || !driveCutIsNewer(file.modified, importedAt)) return false;
  const saved = await downloadDriveFile(cardId, file.id, file.name);
  if (!saved) return false;
  await attachEditedSaved(cardId, saved, "plain", "EDITOR");
  return true;
}
