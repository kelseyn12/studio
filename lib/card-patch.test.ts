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
});
