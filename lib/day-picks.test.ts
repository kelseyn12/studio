import { describe, expect, it } from "vitest";
import { chooseDay, initialDayPicks, takenOnOtherDays } from "@/lib/day-picks";

const days = ["2026-09-27", "2026-09-28"];
const waiting = ["mix-1", "mix-2", "mix-3"];

describe("initialDayPicks", () => {
  it("gives each day a different video", () => {
    expect(initialDayPicks(days, waiting)).toEqual({
      "2026-09-27": "mix-1",
      "2026-09-28": "mix-2",
    });
  });
});

describe("takenOnOtherDays", () => {
  it("hides this day's own pick and lists the rest", () => {
    const picks = initialDayPicks(days, waiting);
    expect([...takenOnOtherDays(picks, "2026-09-27")]).toEqual(["mix-2"]);
  });
});

describe("chooseDay", () => {
  it("moves the other day off a video you just picked", () => {
    const picks = initialDayPicks(days, waiting);
    expect(chooseDay(picks, "2026-09-27", "mix-2", days, waiting)).toEqual({
      "2026-09-27": "mix-2",
      "2026-09-28": "mix-1",
    });
  });
});
