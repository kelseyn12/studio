import type { PipelineStatus } from "@/lib/pipeline";

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
