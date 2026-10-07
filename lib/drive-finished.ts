import { after } from "next/server";
import { attachEditedFile } from "@/lib/cut-ready";
import { driveFolderId, finishedDriveFile, parseDriveFolderList } from "@/lib/drive-folder";
import { directMediaUrl } from "@/lib/media-url";
import { rejectStudioFile } from "@/lib/storage";

const pulling = new Set<string>();

type PullCard = {
  id: string;
  rawsUrl: string;
  cutBy: string;
  assets: Array<{ kind: string }>;
};

/** Look in the shared Drive folder after the page answers. One look at a time per video. */
export function scheduleDrivePull(card: PullCard): void {
  if (card.cutBy !== "EDITOR") return;
  if (!driveFolderId(card.rawsUrl)) return;
  if (card.assets.some((asset) => asset.kind === "EDITED")) return;
  if (pulling.has(card.id)) return;
  pulling.add(card.id);
  after(async () => {
    try {
      await pullFinishedFromDrive(card.id, card.rawsUrl);
    } finally {
      pulling.delete(card.id);
    }
  });
}

async function driveBytes(fileId: string): Promise<{ bytes: Buffer; type: string } | null> {
  const first = directMediaUrl(`https://drive.google.com/file/d/${fileId}/view`);
  if (!first) return null;
  const response = await fetch(first);
  const type = response.headers.get("content-type") || "";
  if (!response.ok) return null;
  if (!type.includes("text/html")) {
    const bytes = Buffer.from(await response.arrayBuffer());
    return { bytes, type: type || "video/mp4" };
  }
  const html = await response.text();
  const confirm = html.match(/confirm=([0-9A-Za-z_]+)/)?.[1];
  if (!confirm) return null;
  const again = await fetch(`${first}&confirm=${confirm}`);
  const againType = again.headers.get("content-type") || "";
  if (!again.ok || againType.includes("text/html")) return null;
  return { bytes: Buffer.from(await again.arrayBuffer()), type: againType || "video/mp4" };
}

/** His finished file, named finished, in the same folder as the raw clips. */
export async function pullFinishedFromDrive(cardId: string, rawsUrl: string): Promise<boolean> {
  const folderId = driveFolderId(rawsUrl);
  if (!folderId) return false;
  const listing = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}`);
  if (!listing.ok) return false;
  const file = finishedDriveFile(parseDriveFolderList(await listing.text()));
  if (!file) return false;
  const downloaded = await driveBytes(file.id);
  if (!downloaded) return false;
  if (rejectStudioFile(downloaded.bytes.length, "EDITED")) return false;
  const name = file.name.includes(".") ? file.name : "finished.mp4";
  await attachEditedFile(cardId, new File([new Uint8Array(downloaded.bytes)], name, { type: downloaded.type }), "plain", "EDITOR");
  return true;
}
