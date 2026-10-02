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

/** One row per file look — both mixes show even before you pick accounts. */
export function shipLooks<
  A extends { kind: string; createdAt: Date; textStyle: string },
  T extends { network: string },
>(assets: A[], targets: T[]): Array<ShipLook<A, T>> {
  const finished = pickFinished(assets);
  if (!finished) return [];
  const groups = targetsByLook(targets);
  const byLook = new Map(groups.map((group) => [group.look, group.accounts]));
  const wanted = new Set<DrawnStyle>([...looksOnFiles(assets), ...groups.map((group) => group.look)]);
  const show = LOOK_ORDER.filter((look) => wanted.has(look));
  return (show.length > 0 ? show : (["plain"] as DrawnStyle[])).map((look) => ({
    look,
    tag: LOOK_TAG[look] || "All apps",
    accounts: byLook.get(look) ?? [],
    asset: pickForLook(assets, look),
  }));
}

export type FileLook = { look: DrawnStyle; tag: string };

/** The looks on a mix's finished files — one "IG · FB" row and one "TT · YT" row when it has both. */
export function fileLooks(assets: Array<{ kind: string; textStyle: string }>): FileLook[] {
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
