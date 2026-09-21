export const PIPELINE_STATUSES = [
  "IDEA",
  "SCRIPTED",
  "FILMED",
  "EDITING",
  "REVIEW",
  "READY",
  "POSTED",
  "DATA",
] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

export const PIPELINE_META: Record<
  PipelineStatus,
  { label: string; owner: string; color: string; next?: PipelineStatus }
> = {
  IDEA: { label: "Idea", owner: "Creator", color: "idea", next: "SCRIPTED" },
  SCRIPTED: { label: "Scripted", owner: "Creator", color: "script", next: "FILMED" },
  FILMED: { label: "Filmed", owner: "Creator", color: "film", next: "EDITING" },
  EDITING: { label: "With editor", owner: "Editor", color: "edit", next: "REVIEW" },
  REVIEW: { label: "To approve", owner: "Creator", color: "review", next: "READY" },
  READY: { label: "To schedule", owner: "Operator", color: "ready", next: "POSTED" },
  POSTED: { label: "Posted", owner: "Operator", color: "live", next: "DATA" },
  DATA: { label: "Has views", owner: "Creator", color: "data" },
};

export const CREATOR_STATUSES: PipelineStatus[] = ["IDEA", "SCRIPTED", "FILMED", "REVIEW"];

export function isPipelineStatus(value: string): value is PipelineStatus {
  return (PIPELINE_STATUSES as readonly string[]).includes(value);
}
