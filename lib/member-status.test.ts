import { describe, expect, it } from "vitest";
import { memberStatus } from "@/lib/member-status";

describe("memberStatus", () => {
  it("stays quiet for a laptop login and says when a real person last opened Studio", () => {
    expect(memberStatus({ email: "kelsey@studio.local", clerkId: null, lastSeenAt: null })).toBe("");
    expect(memberStatus({ email: "tarikh@example.com", clerkId: null, lastSeenAt: null })).toBe("Has not signed in");
    expect(memberStatus({ email: "tarikh@example.com", clerkId: "user_1", lastSeenAt: null })).toBe("Signed in");
    expect(
      memberStatus({
        email: "tarikh@example.com",
        clerkId: "user_1",
        lastSeenAt: new Date("2026-10-06T15:00:00.000Z"),
      }),
    ).toMatch(/^Signed in · Oct /);
  });
});