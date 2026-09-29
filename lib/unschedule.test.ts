import { describe, expect, it } from "vitest";
import { canUnschedule, cancelAlreadyGone, postsToCancel } from "@/lib/unschedule";

describe("canUnschedule", () => {
  it("lets a waiting video come off the calendar", () => {
    expect(canUnschedule("READY")).toBe(true);
    expect(canUnschedule("POSTED")).toBe(false);
    expect(canUnschedule("DATA")).toBe(false);
  });
});

describe("postsToCancel", () => {
  it("keeps one id per Outstand post and skips ones that already went out", () => {
    expect(
      postsToCancel([
        { outstandPostId: "ig", status: "QUEUED" },
        { outstandPostId: "ig", status: "QUEUED" },
        { outstandPostId: "tt", status: "QUEUED" },
        { outstandPostId: "old", status: "PUBLISHED" },
        { outstandPostId: null, status: "FAILED" },
      ]),
    ).toEqual(["ig", "tt"]);
  });
});

describe("cancelAlreadyGone", () => {
  it("treats a missing post as already cancelled", () => {
    expect(cancelAlreadyGone("Post not found")).toBe(true);
    expect(cancelAlreadyGone("Outstand is down")).toBe(false);
  });
});
