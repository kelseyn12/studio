import { describe, expect, it } from "vitest";
import { publishOutcome, retryAccountIds, shortPlatformError } from "@/lib/publish-sync";

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
