import { describe, expect, it } from "vitest";
import { parseConfirm, parsePost, parseUploadTicket, postBody, postedAtFromPost, signedPutTarget, storagePutError } from "@/lib/outstand";

describe("postBody", () => {
  it("puts network blocks beside containers without letting them override the core fields", () => {
    const body = postBody({
      accounts: ["acc_1"],
      content: "hi",
      media: [{ url: "https://media.outstand.so/v.mp4", filename: "v.mp4" }],
      options: { instagram: { reelCoverUrl: "https://media.outstand.so/c.jpg" }, accounts: ["evil"] },
    });
    expect(body.accounts).toEqual(["acc_1"]);
    expect(body.instagram).toEqual({ reelCoverUrl: "https://media.outstand.so/c.jpg" });
    expect(body.containers).toEqual([{ content: "hi", media: [{ url: "https://media.outstand.so/v.mp4", filename: "v.mp4" }] }]);
  });
});

describe("Outstand media parsers", () => {
  it("reads a nested upload ticket", () => {
    expect(
      parseUploadTicket({
        success: true,
        data: { id: "med_1", upload_url: "https://storage.example/put" },
      }),
    ).toEqual({ id: "med_1", uploadUrl: "https://storage.example/put" });
  });

  it("keeps the signed upload query byte for byte", () => {
    const raw =
      "https://bucket.r2.cloudflarestorage.com/file.mp4?X-Amz-Signature=abc+def%2Bxyz&X-Amz-SignedHeaders=host";
    expect(signedPutTarget(raw)).toEqual({
      hostname: "bucket.r2.cloudflarestorage.com",
      path: "/file.mp4?X-Amz-Signature=abc+def%2Bxyz&X-Amz-SignedHeaders=host",
    });
  });

  it("names the storage error code when R2 sends one", () => {
    expect(storagePutError(403, "<Error><Code>SignatureDoesNotMatch</Code></Error>")).toBe(
      "Outstand storage PUT failed (403 SignatureDoesNotMatch)",
    );
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
