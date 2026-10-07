import { describe, expect, it } from "vitest";
import { directMediaUrl, driveLinkKind, isDirectMediaUrl } from "@/lib/media-url";

describe("isDirectMediaUrl", () => {
  it("allows a direct https file", () => {
    expect(isDirectMediaUrl("https://cdn.example.com/cut.mp4")).toBe(true);
  });

  it("does not treat a Drive folder as a direct file", () => {
    expect(isDirectMediaUrl("https://drive.google.com/drive/folders/abc")).toBe(false);
    expect(directMediaUrl("https://drive.google.com/drive/folders/abc")).toBeNull();
  });

  it("takes a file link or a folder link", () => {
    expect(driveLinkKind("https://drive.google.com/file/d/FILE123/view?usp=sharing")).toBe("file");
    expect(driveLinkKind("https://drive.google.com/drive/folders/HERFOLDER?usp=sharing")).toBe("folder");
    expect(driveLinkKind("https://drive.google.com/drive/folders/HISFOLDER?usp=drive_link")).toBe("folder");
    expect(driveLinkKind("https://cdn.example.com/cut.mp4")).toBeNull();
  });

  it("turns a Drive file link into the download", () => {
    expect(directMediaUrl("https://drive.google.com/file/d/FILE123/view?usp=sharing")).toBe(
      "https://drive.usercontent.google.com/download?id=FILE123&export=download&confirm=t",
    );
  });
});
