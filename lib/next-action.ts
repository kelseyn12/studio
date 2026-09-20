import type { PipelineStatus } from "@/lib/pipeline";

export type ActionKind =
  | "script"
  | "film"
  | "handoff"
  | "review"
  | "schedule"
  | "plan"
  | "deal"
  | "batch";

export type StudioAction = {
  kind: ActionKind;
  title: string;
  detail: string;
  href: string;
  count: number;
};

export type MachineCounts = {
  idea: number;
  scripted: number;
  filmed: number;
  editing: number;
  review: number;
  ready: number;
  postedToday: number;
  paidSlotsToday: number;
  activeDeals: number;
  totalCards: number;
};

export function pickNextAction(counts: MachineCounts): StudioAction {
  if (counts.review > 0) {
    return {
      kind: "review",
      title: `Review ${counts.review} edit${counts.review === 1 ? "" : "s"}`,
      detail: "Approve or send back. This is the only creator work after filming.",
      href: "/edits",
      count: counts.review,
    };
  }
  if (counts.ready > 0) {
    return {
      kind: "schedule",
      title: `Schedule ${counts.ready} ready video${counts.ready === 1 ? "" : "s"}`,
      detail: "Operator job. Pick a time and ship through Outstand.",
      href: "/calendar",
      count: counts.ready,
    };
  }
  if (counts.filmed > 0) {
    return {
      kind: "handoff",
      title: `Drop ${counts.filmed} CapCut export${counts.filmed === 1 ? "" : "s"}`,
      detail: "Cut in CapCut. Put the file on the card. Then you are done.",
      href: "/edits",
      count: counts.filmed,
    };
  }
  if (counts.scripted > 0) {
    return {
      kind: "film",
      title: `Film ${counts.scripted} scripted card${counts.scripted === 1 ? "" : "s"}`,
      detail: "Batch by mode. Film the whole block in one sitting.",
      href: "/pipeline?status=SCRIPTED",
      count: counts.scripted,
    };
  }
  if (counts.idea > 0) {
    return {
      kind: "script",
      title: `Script ${counts.idea} idea${counts.idea === 1 ? "" : "s"}`,
      detail: "Premise, hook, body, plug. Do not film until the batch is written.",
      href: "/pipeline?status=IDEA",
      count: counts.idea,
    };
  }
  return {
    kind: "batch",
    title: "Drop clips and multiply",
    detail: "Hooks × bodies × CTAs, then unique copies so platforms do not see the same file.",
    href: "/repurposer",
    count: 0,
  };
}

export function emptyCounts(): MachineCounts {
  return {
    idea: 0,
    scripted: 0,
    filmed: 0,
    editing: 0,
    review: 0,
    ready: 0,
    postedToday: 0,
    paidSlotsToday: 0,
    activeDeals: 0,
    totalCards: 0,
  };
}

export function statusToCountKey(status: PipelineStatus): keyof MachineCounts | null {
  switch (status) {
    case "IDEA":
      return "idea";
    case "SCRIPTED":
      return "scripted";
    case "FILMED":
      return "filmed";
    case "EDITING":
      return "editing";
    case "REVIEW":
      return "review";
    case "READY":
      return "ready";
    default:
      return null;
  }
}
