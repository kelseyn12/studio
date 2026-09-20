import { describe, expect, it } from "vitest";
import { isPageMediaUrl, mediaUrlAllowed } from "@/lib/pull-media";

describe("pullMedia guards", () => {
  it("blocks private hosts", () => {
    expect(mediaUrlAllowed("https://127.0.0.1/a.mp4")).toBe(false);
    expect(mediaUrlAllowed("https://192.168.0.14/a.mp4")).toBe(false);
    expect(mediaUrlAllowed("http://cdn.example.com/a.mp4")).toBe(false);
  });

  it("allows https public files and page hosts", () => {
    expect(mediaUrlAllowed("https://cdn.example.com/cut.mp4")).toBe(true);
    expect(isPageMediaUrl("https://www.tiktok.com/@x/video/1")).toBe(true);
    expect(isPageMediaUrl("https://cdn.example.com/cut.mp4")).toBe(false);
  });
});
