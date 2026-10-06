import { describe, expect, it } from "vitest";
import { cardPatch } from "@/lib/card-patch";

describe("cardPatch", () => {
  it("only writes fields that were on the form", () => {
    const form = new FormData();
    form.set("hook", "open on the result");
    const patch = cardPatch(form);
    expect(patch).toEqual({ hook: "open on the result" });
    expect(patch.payoutCents).toBeUndefined();
    expect(patch.editorNote).toBeUndefined();
  });

  it("stores every reference link with its note", () => {
    const form = new FormData();
    form.append("referenceUrl", "https://example.com/a");
    form.append("referenceNote", "Match the hook");
    form.append("referenceUrl", "https://example.com/b");
    form.append("referenceNote", "Captions sit lower");
    const patch = cardPatch(form);
    expect(patch.referenceUrl).toBe("https://example.com/a");
    expect(patch.referencesJson).toBe(
      JSON.stringify([
        { url: "https://example.com/a", note: "Match the hook" },
        { url: "https://example.com/b", note: "Captions sit lower" },
      ]),
    );
  });

  it("stores cutBy from Footage", () => {
    const form = new FormData();
    form.set("cutBy", "SELF");
    expect(cardPatch(form).cutBy).toBe("SELF");
  });
});
