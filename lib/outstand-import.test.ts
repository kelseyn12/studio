import { describe, expect, it } from "vitest";
import { parseHandPosts, parseImportJob, parseImportJobs } from "@/lib/outstand-import";

describe("parseImportJobs", () => {
  it("reads a job wrapped or listed", () => {
    expect(parseImportJob({ id: "imp_1", status: "queued", since: "2026-09-01T00:00:00.000Z" })?.id).toBe("imp_1");
    expect(parseImportJobs({ data: [{ id: "imp_2", status: "completed", completedAt: "2026-10-01T00:00:00.000Z" }] })).toEqual([
      { id: "imp_2", status: "completed", since: "", completedAt: "2026-10-01T00:00:00.000Z", error: null },
    ]);
  });
});

describe("parseHandPosts", () => {
  it("keeps a published post and skips one that failed", () => {
    const hands = parseHandPosts({
      posts: [
        {
          id: "post_1",
          publishedAt: "2026-10-02T00:00:00.000Z",
          containers: [{ content: "Try it" }],
          socialAccounts: [{ id: "acc_1", network: "instagram", status: "published", platformPostUrl: "https://instagram.com/p/1" }],
        },
        {
          id: "post_2",
          containers: [{ content: "nope" }],
          socialAccounts: [{ id: "acc_1", network: "instagram", status: "failed" }],
        },
      ],
    });
    expect(hands).toEqual([
      {
        id: "post_1",
        content: "Try it",
        publishedAt: "2026-10-02T00:00:00.000Z",
        network: "instagram",
        url: "https://instagram.com/p/1",
        outstandAccountId: "acc_1",
      },
    ]);
  });
});
