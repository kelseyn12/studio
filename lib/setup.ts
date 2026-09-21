export type SetupStep = {
  id: string;
  label: string;
  detail: string;
  href: string;
  done: boolean;
};

export type SetupCounts = {
  accounts: number;
  deals: number;
  formats: number;
  clips: number;
  videos: number;
  editors: number;
  outstand: boolean;
};

/** First-run checklist. The Today page hides it once every step is done. */
export function setupSteps(counts: SetupCounts): SetupStep[] {
  return [
    {
      id: "accounts",
      label: "Add your accounts",
      detail: "The @handles you post to. Everything schedules against these.",
      href: "/connections",
      done: counts.accounts > 0,
    },
    {
      id: "deal",
      label: "Add a deal",
      detail: "Brand, base pay, CPM. Unlocks the scorecard, money tracking, and who owes you.",
      href: "/campaigns",
      done: counts.deals > 0,
    },
    {
      id: "formats",
      label: "Add formats to the deal",
      detail: "Winner / challenger / test lanes. Unlocks the format scorecard on Numbers.",
      href: "/campaigns",
      done: counts.formats > 0,
    },
    {
      id: "clips",
      label: "Drop clips into Multiply",
      detail: "Hooks, bodies, CTAs. One filming session becomes dozens of videos.",
      href: "/repurposer",
      done: counts.clips > 0,
    },
    {
      id: "video",
      label: "Make your first video",
      detail: "Generate a Multiply batch or start a single video.",
      href: "/cards/new",
      done: counts.videos > 0,
    },
    {
      id: "editor",
      label: "Invite your editor",
      detail: "They only see Cuts. You film, they cut, you approve.",
      href: "/team",
      done: counts.editors > 0,
    },
    {
      id: "outstand",
      label: "Connect Outstand",
      detail: "Auto-posting. Without it, Schedule marks days but nothing posts itself.",
      href: "/connections",
      done: counts.outstand,
    },
  ];
}
