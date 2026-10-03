import { describe, expect, it } from "vitest";
import { accountsToSend, lookFailure, parkWrite, shouldClearDay } from "@/lib/publish";

describe("lookFailure", () => {
  it("names the video that Outstand refused", () => {
    expect(lookFailure("instagram", "Outstand storage PUT failed (403)")).toBe(
      "IG · FB video · Outstand storage PUT failed (403)",
    );
    expect(lookFailure("tiktok", "Outstand storage PUT failed (403)")).toBe(
      "TT · YT video · Outstand storage PUT failed (403)",
    );
  });
});

describe("shouldClearDay", () => {
  it("keeps the day when another app already published", () => {
    expect(shouldClearDay(false, true)).toBe(false);
    expect(shouldClearDay(false, false)).toBe(true);
    expect(shouldClearDay(true, false)).toBe(false);
  });
});

describe("parkWrite", () => {
  const when = new Date("2026-09-20T15:00:00.000Z");

  it("does not touch the film date", () => {
    const patch = parkWrite({
      when,
      accountId: "acc_1",
      outstandPostId: "pst_1",
      publishedAt: null,
    });
    expect(patch.status).toBe("READY");
    expect(patch.scheduledAt).toBe(when);
    expect("plannedDate" in patch).toBe(false);
  });

  it("marks Posted only after Outstand has published", () => {
    const publishedAt = new Date("2026-09-21T12:00:00.000Z");
    const patch = parkWrite({
      when,
      accountId: "acc_1",
      outstandPostId: "pst_1",
      publishedAt,
    });
    expect(patch.status).toBe("POSTED");
    expect(patch.postedAt).toEqual(publishedAt);
  });
});

describe("accountsToSend", () => {
  const earlier = new Date("2026-10-03T17:07:00.000Z");
  const later = new Date("2026-10-03T17:11:00.000Z");

  it("sends every app the first time, even if an older try was cancelled", () => {
    expect(
      accountsToSend(
        [{ accountId: "ig", status: "CANCELLED", createdAt: earlier }],
        ["ig", "tt"],
        true,
      ),
    ).toEqual(["ig", "tt"]);
  });

  it("does not send an app that is already queued or published", () => {
    expect(
      accountsToSend(
        [
          { accountId: "ig", status: "QUEUED", createdAt: earlier },
          { accountId: "tt", status: "PUBLISHED", createdAt: earlier },
        ],
        ["ig", "tt"],
        true,
      ),
    ).toEqual([]);
  });

  it("sends nothing when the day is already taken and nothing failed", () => {
    expect(
      accountsToSend(
        [
          { accountId: "ig", status: "QUEUED", createdAt: earlier },
          { accountId: "ig", status: "QUEUED", createdAt: later },
        ],
        ["ig", "tt"],
        false,
      ),
    ).toEqual([]);
    expect(accountsToSend([], ["ig", "tt"], false)).toEqual([]);
  });

  it("sends only the app whose latest try failed", () => {
    expect(
      accountsToSend(
        [
          { accountId: "ig", status: "FAILED", createdAt: earlier },
          { accountId: "ig", status: "QUEUED", createdAt: later },
          { accountId: "tt", status: "PUBLISHED", createdAt: earlier },
          { accountId: "tt", status: "FAILED", createdAt: later },
        ],
        ["ig", "tt", "yt"],
        false,
      ),
    ).toEqual(["tt"]);
  });
});
