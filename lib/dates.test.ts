import { describe, expect, it } from "vitest";
import {
  labelWeekRange,
  labelWhen,
  nextSlotTime,
  openSlotTime,
  parseLocalDate,
  startOfWeek,
  timeAlreadyPassed,
  toInputDate,
} from "@/lib/dates";

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
    expect(nextSlotTime(2)).toBe("18:00");
    expect(nextSlotTime(4)).toBe("20:00");
    expect(nextSlotTime(4)).not.toBe(nextSlotTime(2));
  });

  it("will not offer a day or a clock that already passed", () => {
    const now = new Date(2026, 9, 3, 10, 30);
    expect(openSlotTime(new Date(2026, 8, 27), 0, now)).toBeNull();
    expect(openSlotTime(new Date(2026, 9, 3), 0, now)).toBe("15:00");
    expect(openSlotTime(new Date(2026, 9, 4), 0, now)).toBe("10:00");
    expect(timeAlreadyPassed(new Date(2026, 8, 27, 10, 0), now)).toBe(true);
    expect(timeAlreadyPassed(new Date(2026, 9, 4, 10, 0), now)).toBe(false);
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
