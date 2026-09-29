import { describe, expect, it } from "vitest";
import { publishOutcome, retryAccountIds, shortPlatformError, postedAtWhenLive, accountsReadyToRetry, heldNote, nextUploadWindow, retryAt } from "@/lib/publish-sync";

describe("publishOutcome", () => {
  it("keeps a pending app queued", () => {
    expect(publishOutcome({ status: "pending" }).status).toBe("QUEUED");
  });

  it("marks a live app published", () => {
    const outcome = publishOutcome({
      status: "published",
      publishedAt: "2026-09-29T15:01:09.759Z",
      platformPostId: "7690972296542047519",
    });
    expect(outcome.status).toBe("PUBLISHED");
    expect(outcome.publishedAt?.toISOString()).toBe("2026-09-29T15:01:09.759Z");
    expect(outcome.platformPostId).toBe("7690972296542047519");
  });

  it("stores a short reason when an app rejects the post", () => {
    const outcome = publishOutcome({
      status: "failed",
      error: 'Error publishing post to YouTube: 429 - {"error":{"message":"Quota exceeded for quota metric"}}',
    });
    expect(outcome.status).toBe("FAILED");
    expect(outcome.error).toBe("YouTube daily upload limit is used up. It resets overnight.");
  });
});

describe("shortPlatformError", () => {
  it("names the app that could not take the file", () => {
    expect(shortPlatformError("Unable to fetch video file from URL.")).toBe(
      "Facebook could not download the video file.",
    );
    expect(shortPlatformError('Container processing failed: ERROR')).toBe(
      "Instagram could not process the video.",
    );
  });
});

describe("retryAccountIds", () => {
  const jobs = [
    { id: "ig", cardId: "mix1", accountId: "ig-acc", status: "FAILED", account: { network: "instagram" } },
    { id: "fb", cardId: "mix1", accountId: "fb-acc", status: "FAILED", account: { network: "facebook" } },
    { id: "yt", cardId: "mix1", accountId: "yt-acc", status: "FAILED", account: { network: "youtube" } },
    { id: "tt", cardId: "mix1", accountId: "tt-acc", status: "PUBLISHED", account: { network: "tiktok" } },
    { id: "other", cardId: "mix3", accountId: "ig-2", status: "FAILED", account: { network: "instagram" } },
  ];

  it("retries the failed look only, and leaves TikTok alone", () => {
    expect(retryAccountIds(jobs, "ig")).toEqual(["ig-acc", "fb-acc"]);
    expect(retryAccountIds(jobs, "yt")).toEqual(["yt-acc"]);
  });
});

describe("postedAtWhenLive", () => {
  const at = new Date("2026-09-29T15:01:00.000Z");

  it("waits while any app is still queued", () => {
    expect(
      postedAtWhenLive([
        { status: "PUBLISHED", publishedAt: at },
        { status: "QUEUED", publishedAt: null },
      ]),
    ).toBeNull();
  });

  it("marks Posted once an app is live and nothing is waiting", () => {
    expect(
      postedAtWhenLive([
        { status: "PUBLISHED", publishedAt: at },
        { status: "FAILED", publishedAt: null },
      ]),
    ).toEqual(at);
  });
});

describe("accountsReadyToRetry", () => {
  const now = new Date("2026-09-29T18:00:00.000Z");
  const earlier = new Date("2026-09-29T15:00:00.000Z");

  it("retries a failed app once and leaves a published one alone", () => {
    expect(
      accountsReadyToRetry(
        [
          { cardId: "mix", accountId: "ig", status: "FAILED", error: "Instagram could not process the video.", createdAt: earlier },
          { cardId: "mix", accountId: "tt", status: "PUBLISHED", error: null, createdAt: earlier },
        ],
        now,
      ),
    ).toEqual([{ cardId: "mix", accountIds: ["ig"] }]);
  });

  it("names an app that is still waiting after the others posted", () => {
    const live = new Date("2026-09-29T20:01:00.000Z");
    expect(
      heldNote(
        [
          { status: "PUBLISHED", scheduledAt: live, network: "tiktok" },
          { status: "QUEUED", scheduledAt: new Date("2026-09-30T07:15:00.000Z"), network: "youtube" },
        ],
        live,
      ),
    ).toMatch(/^YouTube sends at /);
  });

  it("sends YouTube on its own after the daily cap", () => {
    expect(
      accountsReadyToRetry(
        [
          {
            cardId: "mix",
            accountId: "yt",
            status: "FAILED",
            error: "YouTube daily upload limit is used up. It resets overnight.",
            createdAt: earlier,
          },
        ],
        now,
      ),
    ).toEqual([{ cardId: "mix", accountIds: ["yt"] }]);
  });

  it("sets that YouTube send for 12:15 AM Pacific", () => {
    expect(
      retryAt(
        [
          {
            cardId: "mix",
            accountId: "yt",
            status: "FAILED",
            error: "YouTube daily upload limit is used up. It resets overnight.",
            createdAt: earlier,
            scheduledAt: earlier,
          },
        ],
        "mix",
        ["yt"],
        now,
      ).toISOString(),
    ).toBe(nextUploadWindow(earlier).toISOString());
    expect(nextUploadWindow(earlier).toISOString()).toBe("2026-09-30T07:15:00.000Z");
  });

  it("stops after one automatic retry", () => {
    expect(
      accountsReadyToRetry(
        [
          { cardId: "mix", accountId: "ig", status: "FAILED", error: "Instagram could not process the video.", createdAt: earlier },
          { cardId: "mix", accountId: "ig", status: "FAILED", error: "Instagram could not process the video.", createdAt: now },
        ],
        now,
      ),
    ).toEqual([]);
  });
});
