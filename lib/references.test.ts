import { describe, expect, it } from "vitest";
import { httpsUrl, packReferences, parseReferences, referenceLines, referencesFromForm } from "@/lib/references";

describe("references", () => {
  it("keeps an old single link and a note on each new one", () => {
    expect(parseReferences("[]", "https://example.com/a")).toEqual([{ url: "https://example.com/a", note: "" }]);
    expect(parseReferences("", "")).toEqual([]);
    const saved = packReferences([
      { url: " https://example.com/a ", note: " Match the hook " },
      { url: "", note: "" },
      { url: "https://example.com/b", note: "Captions sit lower" },
    ]);
    expect(saved.referenceUrl).toBe("https://example.com/a");
    expect(parseReferences(saved.referencesJson, "https://ignored.example")).toEqual([
      { url: "https://example.com/a", note: "Match the hook" },
      { url: "https://example.com/b", note: "Captions sit lower" },
    ]);
    expect(referenceLines(parseReferences(saved.referencesJson))).toBe(
      "https://example.com/a — Match the hook\nhttps://example.com/b — Captions sit lower",
    );
  });

  it("reads the form list and still falls back to the old single link", () => {
    expect(
      referencesFromForm(["https://example.com/a", ""], ["Match the hook", ""], "[]", "https://old.example"),
    ).toEqual([{ url: "https://example.com/a", note: "Match the hook" }]);
    expect(referencesFromForm(undefined, undefined, "[]", "https://old.example")).toEqual([
      { url: "https://old.example", note: "" },
    ]);
  });

  it("only turns https into a link", () => {
    expect(httpsUrl("https://drive.google.com/file/x")).toBe("https://drive.google.com/file/x");
    expect(httpsUrl("http://example.com")).toBeNull();
    expect(httpsUrl("not a link")).toBeNull();
  });
});
