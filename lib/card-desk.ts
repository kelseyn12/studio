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

/** One row per app look that will ship — IG · FB and TT · YT stay separate. */
export function shipLooks<
  A extends { kind: string; createdAt: Date; textStyle: string },
  T extends { network: string },
>(assets: A[], targets: T[]): Array<ShipLook<A, T>> {
  const finished = pickFinished(assets);
  if (!finished) return [];
  const groups = targetsByLook(targets);
  if (groups.length === 0) {
    const look = (["instagram", "tiktok", "plain"].includes(finished.textStyle)
      ? finished.textStyle
      : "plain") as DrawnStyle;
    return [{ look, tag: LOOK_TAG[look] || "All apps", accounts: [], asset: finished }];
  }
  return groups.map((group) => ({
    look: group.look,
    tag: LOOK_TAG[group.look] || group.look,
    accounts: group.accounts,
    asset: pickForLook(assets, group.look) ?? finished,
  }));
}

/** "IG · FB + TT · YT" for chips when a video has both files. */
export function lookLabels(assets: Array<{ kind: string; textStyle: string }>): string {
  const order: DrawnStyle[] = ["instagram", "tiktok", "plain"];
  const have = new Set(
    assets
      .filter((asset) => asset.kind === "GENERATED" || asset.kind === "EDITED")
      .map((asset) => asset.textStyle),
  );
  return order
    .filter((look) => have.has(look))
    .map((look) => LOOK_TAG[look])
    .filter(Boolean)
    .join(" + ");
}
