import type { PipelineStatus } from "@/lib/pipeline";
import { targetsByLook } from "@/lib/targets";
import { LOOK_TAG, type DrawnStyle } from "@/lib/text-style";

export const DESK_STAGES = ["brief", "footage", "editor", "live"] as const;
export type DeskStage = (typeof DESK_STAGES)[number];

export function deskStage(status: PipelineStatus): DeskStage {
  if (status === "IDEA") return "brief";
  if (status === "SCRIPTED") return "footage";
  if (status === "FILMED" || status === "EDITING") return "editor";
  return "live";
}

export function isDeskStage(value: string | undefined): value is DeskStage {
  return Boolean(value && (DESK_STAGES as readonly string[]).includes(value));
}

export function nextStatusFor(stage: DeskStage, status: PipelineStatus): PipelineStatus | null {
  if (stage === "brief" && status === "IDEA") return "SCRIPTED";
  if (stage === "footage" && (status === "IDEA" || status === "SCRIPTED")) return "FILMED";
  if (stage === "editor" && status === "FILMED") return "EDITING";
  return null;
}

/** Already on his Cuts page, in To cut or Cutting. A second Send must not ping him again. */
export function alreadyWithEditor(
  card: { status: string; cutBy: string; editorId: string | null } | null,
  editorId: string,
): boolean {
  const withHim = card?.status === "FILMED" || card?.status === "EDITING";
  return Boolean(card && withHim && card.cutBy === "EDITOR" && card.editorId === editorId);
}

/** Send leaves a new job in To cut. Cutting starts when he presses Start cutting. */
export function keepInToCut(next: PipelineStatus | null): PipelineStatus | null {
  if (next === "EDITING") return null;
  return next;
}

/** He has the job and has not downloaded yet. Only his click moves it to Cutting. */
export function shouldStartCutting(
  card: { status: string; cutBy: string; editorId: string | null } | null,
  user: { role: string; id: string },
): boolean {
  return Boolean(
    card &&
      user.role === "EDITOR" &&
      card.status === "FILMED" &&
      card.cutBy === "EDITOR" &&
      card.editorId === user.id,
  );
}

export function sendBackStatus(status: PipelineStatus): PipelineStatus | null {
  if (status === "REVIEW") return "EDITING";
  return null;
}

/** The file that ships: newest editor cut first, else newest generated video. */
export function pickFinished<T extends { kind: string; createdAt: Date }>(assets: T[]): T | undefined {
  const newestFirst = [...assets].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return (
    newestFirst.find((asset) => asset.kind === "EDITED") ??
    newestFirst.find((asset) => asset.kind === "GENERATED")
  );
}

/** A file with no look, or plain, is the same video for every app. A tagged file stays on its look. */
function coversLook(textStyle: string, look: string): boolean {
  if (textStyle === look) return true;
  return !textStyle || textStyle === "plain";
}

/**
 * The file that ships to one look. An IG/FB upload does not fill TT/YT. A file marked both
 * (or an older cut with no look) still ships to every app.
 */
export function pickForLook<T extends { kind: string; createdAt: Date; textStyle: string }>(
  assets: T[],
  look: string,
): T | undefined {
  const newestFirst = [...assets].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return (
    newestFirst.find((asset) => asset.kind === "EDITED" && asset.textStyle === look) ??
    newestFirst.find((asset) => asset.kind === "EDITED" && coversLook(asset.textStyle, look) && asset.textStyle !== "instagram" && asset.textStyle !== "tiktok") ??
    newestFirst.find((asset) => asset.kind === "GENERATED" && coversLook(asset.textStyle, look))
  );
}

export type ShipLook<A, T> = { look: DrawnStyle; tag: string; accounts: T[]; asset: A | undefined };

const LOOK_ORDER: DrawnStyle[] = ["instagram", "tiktok", "plain"];

function looksOnFiles(assets: Array<{ kind: string; textStyle: string }>): DrawnStyle[] {
  const have = new Set<string>();
  for (const asset of assets) {
    if (asset.kind !== "GENERATED" && asset.kind !== "EDITED") continue;
    if (asset.textStyle === "instagram" || asset.textStyle === "tiktok") have.add(asset.textStyle);
  }
  return LOOK_ORDER.filter((look) => have.has(look));
}

/** TT reaction and Tier list TT start on the TT · YT drop. Everything else starts on IG · FB. */
export function lookForNewDrop(title: string): "instagram" | "tiktok" {
  return /\btt\b/i.test(title) && !/\big\b/i.test(title) ? "tiktok" : "instagram";
}

function isFinished(kind: string): boolean {
  return kind === "EDITED" || kind === "GENERATED";
}

/** One file for every app. Two tagged looks (IG and TT) stay split. A plain file wins over a stray tag. */
export function isOneVideo(assets: Array<{ kind: string; textStyle: string }>): boolean {
  const finished = assets.filter((asset) => isFinished(asset.kind));
  if (finished.length === 0) return false;
  const looks = looksOnFiles(finished);
  if (looks.includes("instagram") && looks.includes("tiktok")) return false;
  return finished.some((asset) => !asset.textStyle || asset.textStyle === "plain");
}

/** Dropping One video replaces every finished file. Dropping one look replaces that look and any one-video file. */
export function priorEditedIds(
  assets: Array<{ id: string; kind: string; textStyle: string }>,
  textStyle: string,
  keepId?: string,
): string[] {
  const edited = assets.filter((asset) => asset.kind === "EDITED" && asset.id !== keepId);
  if (!textStyle || textStyle === "plain") return edited.map((asset) => asset.id);
  return edited
    .filter((asset) => asset.textStyle === textStyle || !asset.textStyle || asset.textStyle === "plain")
    .map((asset) => asset.id);
}

/** Discord only when he drops the finished file on a job she sent him. Her own drop stays quiet. */
export function pingForFinishedDrop(uploaderRole: string, cutBy: string): boolean {
  return uploaderRole === "EDITOR" && cutBy === "EDITOR";
}

/** She cuts it herself, so the drop is ready to schedule. His drop still waits for her. */
export function statusAfterDrop(cutBy: string, status: string): "READY" | "REVIEW" | null {
  if (status === "POSTED" || status === "DATA") return null;
  if (cutBy === "SELF") return status === "READY" ? null : "READY";
  if (status === "READY" || status === "REVIEW") return null;
  return "REVIEW";
}

/** One video shows once. The plain file is the one that posts. */
export function visibleAssets<T extends { id: string; kind: string; textStyle: string; createdAt: Date }>(assets: T[]): T[] {
  if (!isOneVideo(assets)) return assets;
  const newestFirst = [...assets].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const keep =
    newestFirst.find((asset) => asset.kind === "EDITED" && (!asset.textStyle || asset.textStyle === "plain")) ??
    newestFirst.find((asset) => asset.kind === "EDITED");
  if (!keep) return assets;
  return assets.filter((asset) => asset.kind !== "EDITED" || asset.id === keep.id);
}

/**
 * One row per file already on this video. An IG-only upload does not grow a TT drop —
 * that other version is its own video. One video is a single row with every account.
 */
export function shipLooks<
  A extends { kind: string; createdAt: Date; textStyle: string },
  T extends { network: string },
>(assets: A[], targets: T[]): Array<ShipLook<A, T>> {
  const finished = pickFinished(assets);
  if (!finished) return [];
  if (isOneVideo(assets)) {
    const newestFirst = [...assets].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const asset =
      newestFirst.find((item) => isFinished(item.kind) && (!item.textStyle || item.textStyle === "plain")) ?? finished;
    return [{ look: "plain", tag: "All apps", accounts: targets, asset }];
  }
  const groups = targetsByLook(targets);
  const byLook = new Map(groups.map((group) => [group.look, group.accounts]));
  const onFiles = looksOnFiles(assets);
  const show = onFiles.length > 0 ? onFiles : groups.length > 0 ? groups.map((group) => group.look) : (["plain"] as DrawnStyle[]);
  return show.map((look) => ({
    look,
    tag: LOOK_TAG[look] || "All apps",
    accounts: byLook.get(look) ?? [],
    asset: pickForLook(assets, look),
  }));
}

export type FileLook = { look: DrawnStyle; tag: string };

/** The looks on a mix's finished files — one "IG · FB" row and one "TT · YT" row when it has both. */
export function fileLooks(assets: Array<{ kind: string; textStyle: string }>): FileLook[] {
  if (isOneVideo(assets)) return [{ look: "plain", tag: "All apps" }];
  const looks = looksOnFiles(assets);
  const show = looks.length > 0 ? looks : (["plain"] as DrawnStyle[]);
  return show.map((look) => ({ look, tag: LOOK_TAG[look] || "All apps" }));
}

/** "Mix 6 · BANGER" — the month cell is too narrow for the full studio title. */
export function filmChipLabel(title: string): string {
  const parts = title.split("·").map((part) => part.trim()).filter(Boolean);
  const mix = parts.find((part) => /^mix\s+\d+$/i.test(part));
  if (!mix) return title;
  const rest = parts.filter((part) => part !== mix && !/^this week$/i.test(part));
  return [`Mix ${mix.replace(/^mix\s+/i, "")}`, ...rest].join(" · ");
}
