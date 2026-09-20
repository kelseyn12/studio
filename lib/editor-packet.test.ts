import { describe, expect, it } from "vitest";
import { editorNeeds, packetReady } from "@/lib/editor-packet";

describe("editorNeeds", () => {
  it("flags an empty card", () => {
    const items = editorNeeds({
      hook: "",
      body: "",
      script: "",
      editorNote: "",
      referenceUrl: "",
      assets: [],
    });
    expect(packetReady(items)).toBe(false);
    expect(items.every((item) => !item.ok)).toBe(true);
  });

  it("is ready when the packet is full", () => {
    const items = editorNeeds({
      hook: "Stop scrolling",
      body: "Here is the demo",
      script: "",
      editorNote: "Keep captions big",
      referenceUrl: "https://example.com",
      assets: [{ kind: "RAW" }],
    });
    expect(packetReady(items)).toBe(true);
  });
});
