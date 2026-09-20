import { describe, expect, it } from "vitest";
import { editorNeeds, packetReady } from "@/lib/editor-packet";

describe("editorNeeds", () => {
  it("flags an empty card", () => {
    const items = editorNeeds({
      hook: "",
      body: "",
      script: "",
      editorNote: "",
      rawsUrl: "",
      assets: [],
    });
    expect(packetReady(items)).toBe(false);
    expect(items.every((item) => !item.ok)).toBe(true);
  });

  it("accepts a Drive folder instead of dumped files", () => {
    const items = editorNeeds({
      hook: "Stop scrolling",
      body: "Here is the demo",
      script: "",
      editorNote: "Keep captions big",
      rawsUrl: "https://drive.google.com/drive/folders/abc",
      assets: [],
    });
    expect(packetReady(items)).toBe(true);
  });
});
