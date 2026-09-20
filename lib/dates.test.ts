import { describe, expect, it } from "vitest";
import { labelWeekRange, parseLocalDate, startOfWeek, toInputDate } from "@/lib/dates";

describe("local calendar dates", () => {
  it("parses a YYYY-MM-DD as a local day, not UTC midnight", () => {
    const day = parseLocalDate("2026-09-03");
    expect(day.getFullYear()).toBe(2026);
    expect(day.getMonth()).toBe(8);
    expect(day.getDate()).toBe(3);
    expect(day.getHours()).toBe(0);
  });

  it("labels a week the way the posting calendar does", () => {
    const start = startOfWeek(parseLocalDate("2026-09-03"));
    expect(toInputDate(start)).toBe("2026-08-30");
    expect(labelWeekRange(start)).toBe("Aug 30 – Sep 5, 2026");
  });
});
