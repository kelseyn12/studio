import { describe, expect, it } from "vitest";
import { directMediaUrl, isDirectMediaUrl } from "@/lib/media-url";

describe("isDirectMediaUrl", () => {
  it("allows a direct https file", () => {
    expect(isDirectMediaUrl("https://cdn.example.com/cut.mp4")).toBe(true);
  });

  it("rejects a Drive folder", () => {
    expect(isDirectMediaUrl("https://drive.google.com/drive/folders/abc")).toBe(false);
    expect(directMediaUrl("https://drive.google.com/drive/folders/abc")).toBeNull();
  });

  it("turns a Drive file link into the download", () => {
    expect(directMediaUrl("https://drive.google.com/file/d/FILE123/view?usp=sharing")).toBe(
      "https://drive.google.com/uc?export=download&id=FILE123",
    );
  });
});
