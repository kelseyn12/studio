import { describe, expect, it } from "vitest";
import { labelWeekRange, labelWhen, nextSlotTime, parseLocalDate, startOfWeek, toInputDate } from "@/lib/dates";

describe("local calendar dates", () => {
  it("parses a YYYY-MM-DD as a local day, not UTC midnight", () => {
    const day = parseLocalDate("2026-09-03");
    expect(day.getFullYear()).toBe(2026);
    expect(day.getMonth()).toBe(8);
    expect(day.getDate()).toBe(3);
    expect(day.getHours()).toBe(0);
  });

  it("offers a later time when the day already has a video", () => {
    expect(nextSlotTime(0)).toBe("10:00");
    expect(nextSlotTime(1)).toBe("15:00");
    expect(nextSlotTime(4)).toBe("18:00");
  });

  it("puts the weekday on a scheduled row", () => {
    expect(labelWhen(new Date(2026, 8, 28, 10, 0))).toBe("Mon, Sep 28 · 10:00 AM");
  });

  it("labels a week the way the posting calendar does", () => {
    const start = startOfWeek(parseLocalDate("2026-09-03"));
    expect(toInputDate(start)).toBe("2026-08-30");
    expect(labelWeekRange(start)).toBe("Aug 30 – Sep 5, 2026");
  });
});
