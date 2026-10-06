import { describe, expect, it } from "vitest";
import { previewEditorId } from "@/lib/editor-preview";

describe("previewEditorId", () => {
  const editors = ["tarikh", "kelso"];

  it("lets the creator open one editor's page", () => {
    expect(previewEditorId("CREATOR", "tarikh", editors)).toBe("tarikh");
  });

  it("ignores a person who is not an editor", () => {
    expect(previewEditorId("CREATOR", "someone", editors)).toBeNull();
    expect(previewEditorId("CREATOR", "", editors)).toBeNull();
    expect(previewEditorId("CREATOR", undefined, editors)).toBeNull();
  });

  it("does not let an editor preview another login", () => {
    expect(previewEditorId("EDITOR", "kelso", editors)).toBeNull();
  });
});
