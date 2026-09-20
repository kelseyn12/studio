import { describe, expect, it } from "vitest";
import { parseConfirm, parseUploadTicket } from "@/lib/outstand";

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
});
