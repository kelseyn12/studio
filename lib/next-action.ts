import type { PipelineStatus } from "@/lib/pipeline";

export type ActionKind =
  | "script"
  | "film"
  | "handoff"
  | "review"
  | "schedule"
  | "plan"
  | "deal"
  | "batch"
  | "cut";

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
  cutSelf: number;
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
      detail: "Watch the cut. Looks good sends it to the Library. Park on Live when you pick a time.",
      href: "/edits",
      count: counts.review,
    };
  }
  if (counts.ready > 0) {
    return {
      kind: "schedule",
      title: `Park ${counts.ready} ready video${counts.ready === 1 ? "" : "s"} on Live`,
      detail: "The file is done. Pick a day and it ships. Nothing goes out until you park it.",
      href: "/calendar",
      count: counts.ready,
    };
  }
  if (counts.filmed > 0) {
    return {
      kind: "handoff",
      title: `Send ${counts.filmed} filmed card${counts.filmed === 1 ? "" : "s"} to the editor`,
      detail: "They download the packet on their machine. You only review.",
      href: "/edits",
      count: counts.filmed,
    };
  }
  if (counts.cutSelf > 0) {
    return {
      kind: "cut",
      title: `Cut ${counts.cutSelf} video${counts.cutSelf === 1 ? "" : "s"}`,
      detail: "You are the editor. Drop the 1080 export. Nothing to send.",
      href: "/edits",
      count: counts.cutSelf,
    };
  }
  if (counts.scripted > 0) {
    return {
      kind: "film",
      title: `Film ${counts.scripted} scripted card${counts.scripted === 1 ? "" : "s"}`,
      detail: "Batch by mode. Film the whole block in one sitting.",
      href: "/plan",
      count: counts.scripted,
    };
  }
  if (counts.idea > 0) {
    return {
      kind: "script",
      title: `Script ${counts.idea} idea${counts.idea === 1 ? "" : "s"}`,
      detail: "Premise, hook, body, plug. Do not film until the batch is written.",
      href: "/plan",
      count: counts.idea,
    };
  }
  if (counts.activeDeals > 0 && counts.totalCards === 0) {
    return {
      kind: "deal",
      title: "Add the first card for a live deal",
      detail: "A deal is on. One card starts the month. Multiply can wait.",
      href: "/campaigns",
      count: counts.activeDeals,
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
    cutSelf: 0,
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
      return null;
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
