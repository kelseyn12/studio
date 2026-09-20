import { describe, expect, it } from "vitest";
import { parseConfirm, parsePost, parseUploadTicket, postedAtFromPost } from "@/lib/outstand";

describe("Outstand media parsers", () => {
  it("reads a nested upload ticket", () => {
    expect(
      parseUploadTicket({
        success: true,
        data: { id: "med_1", upload_url: "https://storage.example/put" },
      }),
    ).toEqual({ id: "med_1", uploadUrl: "https://storage.example/put" });
  });

  it("reads a nested confirm URL", () => {
    expect(parseConfirm({ data: { url: "https://media.outstand.so/x.mp4" } })).toEqual({
      url: "https://media.outstand.so/x.mp4",
    });
  });

  it("reads a nested scheduled post", () => {
    expect(parsePost({ success: true, post: { id: "pst_1", scheduledAt: "2026-09-03T10:00:00.000Z" } }).id).toBe("pst_1");
  });

  it("treats a published account stamp as live", () => {
    const at = postedAtFromPost({
      id: "pst_2",
      scheduledAt: null,
      publishedAt: null,
      socialAccounts: [{ id: "a", network: "instagram", username: "k", status: "published", publishedAt: "2026-09-21T08:00:00.000Z" }],
    });
    expect(at?.toISOString()).toBe("2026-09-21T08:00:00.000Z");
  });
});
