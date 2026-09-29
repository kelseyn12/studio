"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { chooseDay } from "@/lib/day-picks";

type Picks = {
  value: (isoDay: string) => string;
  choose: (isoDay: string, cardId: string) => void;
};

const DayPickContext = createContext<Picks | null>(null);

/** Days start on "Pick a video". Choosing a mix here takes it off any other day that had it. */
export function DayPicks({ waitingIds, children }: { waitingIds: string[]; children: ReactNode }) {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const waitKey = waitingIds.join(",");
  useEffect(() => {
    setPicks({});
  }, [waitKey]);
  const api = useMemo<Picks>(
    () => ({
      value: (isoDay) => picks[isoDay] || "",
      choose: (isoDay, cardId) => setPicks((current) => chooseDay(current, isoDay, cardId)),
    }),
    [picks],
  );
  return <DayPickContext.Provider value={api}>{children}</DayPickContext.Provider>;
}

export function useDayPicks(): Picks | null {
  return useContext(DayPickContext);
}
