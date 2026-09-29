"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { chooseDay, initialDayPicks, takenOnOtherDays } from "@/lib/day-picks";

type Picks = {
  value: (isoDay: string) => string;
  taken: (isoDay: string) => Set<string>;
  choose: (isoDay: string, cardId: string) => void;
};

const DayPickContext = createContext<Picks | null>(null);

export function DayPicks({
  isoDays,
  waitingIds,
  children,
}: {
  isoDays: string[];
  waitingIds: string[];
  children: ReactNode;
}) {
  const [picks, setPicks] = useState(() => initialDayPicks(isoDays, waitingIds));
  const dayKey = isoDays.join(",");
  const waitKey = waitingIds.join(",");
  useEffect(() => {
    setPicks(initialDayPicks(isoDays, waitingIds));
  }, [dayKey, waitKey]);
  const api = useMemo<Picks>(
    () => ({
      value: (isoDay) => picks[isoDay] || "",
      taken: (isoDay) => takenOnOtherDays(picks, isoDay),
      choose: (isoDay, cardId) => setPicks((current) => chooseDay(current, isoDay, cardId, isoDays, waitingIds)),
    }),
    [picks, isoDays, waitingIds],
  );
  return <DayPickContext.Provider value={api}>{children}</DayPickContext.Provider>;
}

export function useDayPicks(): Picks | null {
  return useContext(DayPickContext);
}
