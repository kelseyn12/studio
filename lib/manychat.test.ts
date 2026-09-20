import { describe, expect, it } from "vitest";
import { manychatPayload } from "@/lib/manychat";

describe("ManyChat payload", () => {
  it("sends Instagram text with a subscriber id", () => {
    expect(manychatPayload({ subscriberId: "2059754198", text: "New cut is in", channel: "instagram" })).toEqual({
      subscriber_id: 2059754198,
      data: {
        version: "v2",
        content: { type: "instagram", messages: [{ type: "text", text: "New cut is in" }] },
      },
      message_tag: "ACCOUNT_UPDATE",
    });
  });
});
