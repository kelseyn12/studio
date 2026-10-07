import { describe, expect, it } from "vitest";
import { FIRST_REMIND_MS, NEXT_REMIND_MS, reminderDue } from "@/lib/change-reminder";

const sent = new Date("2026-10-07T12:00:00.000Z");

describe("reminderDue", () => {
  it("stays quiet while the first ping is still fresh", () => {
    expect(reminderDue(sent, new Date(sent.getTime() + FIRST_REMIND_MS - 1), null)).toBe(false);
  });

  it("nudges once the fix has been sitting for 4 hours", () => {
    expect(reminderDue(sent, new Date(sent.getTime() + FIRST_REMIND_MS), null)).toBe(true);
  });

  it("waits a day after a nudge", () => {
    const nudged = new Date(sent.getTime() + FIRST_REMIND_MS);
    expect(reminderDue(sent, new Date(nudged.getTime() + NEXT_REMIND_MS - 1), nudged)).toBe(false);
    expect(reminderDue(sent, new Date(nudged.getTime() + NEXT_REMIND_MS), nudged)).toBe(true);
  });
});
