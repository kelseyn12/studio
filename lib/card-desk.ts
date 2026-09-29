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

/**
 * The file that ships to accounts wanting one text look. An editor's cut always wins (it is the
 * same for every app); otherwise the Multiply file built in that look; otherwise whatever is newest.
 */
export function pickForLook<T extends { kind: string; createdAt: Date; textStyle: string }>(
  assets: T[],
  look: string,
): T | undefined {
  const newestFirst = [...assets].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return (
    newestFirst.find((asset) => asset.kind === "EDITED") ??
    newestFirst.find((asset) => asset.kind === "GENERATED" && asset.textStyle === look) ??
    pickFinished(assets)
  );
}

export type ShipLook<A, T> = { look: DrawnStyle; tag: string; accounts: T[]; asset: A };

const LOOK_ORDER: DrawnStyle[] = ["instagram", "tiktok", "plain"];

function looksOnFiles(assets: Array<{ kind: string; textStyle: string }>): DrawnStyle[] {
  const have = new Set(assets.filter((asset) => asset.kind === "GENERATED").map((asset) => asset.textStyle));
  return LOOK_ORDER.filter((look) => have.has(look));
}

/** One row per file look — both mixes show even before you pick accounts. */
export function shipLooks<
  A extends { kind: string; createdAt: Date; textStyle: string },
  T extends { network: string },
>(assets: A[], targets: T[]): Array<ShipLook<A, T>> {
  const finished = pickFinished(assets);
  if (!finished) return [];
  const groups = targetsByLook(targets);
  const byLook = new Map(groups.map((group) => [group.look, group.accounts]));
  const looks = looksOnFiles(assets);
  const show = looks.length > 0 ? looks : groups.length > 0 ? groups.map((group) => group.look) : (["plain"] as DrawnStyle[]);
  return show.map((look) => ({
    look,
    tag: LOOK_TAG[look] || "All apps",
    accounts: byLook.get(look) ?? [],
    asset: pickForLook(assets, look) ?? finished,
  }));
}
