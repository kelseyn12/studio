import { describe, expect, it } from "vitest";
import { isDirectMediaUrl } from "@/lib/media-url";

describe("isDirectMediaUrl", () => {
  it("allows a direct https file", () => {
    expect(isDirectMediaUrl("https://cdn.example.com/cut.mp4")).toBe(true);
  });

  it("rejects a Drive folder", () => {
    expect(isDirectMediaUrl("https://drive.google.com/drive/folders/abc")).toBe(false);
  });
});
