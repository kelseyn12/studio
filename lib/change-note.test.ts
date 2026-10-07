import { describe, expect, it } from "vitest";
import { approvalLine, changePreview, needsChanges, splitChangeNote, withApproval, withChangeNote } from "@/lib/change-note";
import { shotsForFix } from "@/lib/files";

describe("change note", () => {
  it("puts the fix on top and keeps the brief", () => {
    const brief = "Keep the drawer shot\n\nVoice: Hey hey, sorry this took so long.";
    const once = withChangeNote(brief, "Tighten the hook to 2 seconds");
    expect(once).toBe(`Fix: Tighten the hook to 2 seconds\n\n${brief}`);
    expect(splitChangeNote(once)).toEqual({ fix: "Tighten the hook to 2 seconds", brief });
  });

  it("a second fix replaces the first", () => {
    const twice = withChangeNote("Fix: old ask\n\nKeep the drawer shot", "Bigger captions");
    expect(twice).toBe("Fix: Bigger captions\n\nKeep the drawer shot");
  });

  it("flags a cut that was sent back", () => {
    expect(needsChanges("EDITING", "Fix: Bigger captions\n\nKeep the drawer shot")).toBe(true);
    expect(needsChanges("EDITING", "Keep the drawer shot")).toBe(false);
    expect(needsChanges("REVIEW", "Fix: Bigger captions")).toBe(false);
  });

  it("keeps the first line short for the Cuts list", () => {
    expect(changePreview("Tighten the hook\n\nAnd the end")).toBe("Tighten the hook");
    expect(changePreview("x".repeat(20), 10)).toBe(`${"x".repeat(9)}…`);
  });

  it("pings him on approve, with her note when she wrote one", () => {
    expect(approvalLine("Snapfind", "good job")).toBe("Approved: Snapfind. good job");
    expect(approvalLine("Snapfind", "")).toBe("Approved: Snapfind. You are done.");
    expect(withApproval("Fix: Bigger captions\n\nKeep the drawer shot", "good job")).toBe(
      "Keep the drawer shot\n\nApproved: good job",
    );
    expect(withApproval("Fix: Bigger captions\n\nKeep the drawer shot", "")).toBe("Keep the drawer shot");
  });

  it("puts a screenshot dropped after the cut on the fix", () => {
    const cut = new Date("2026-10-07T18:00:00Z");
    const before = new Date("2026-10-07T12:00:00Z");
    const after = new Date("2026-10-07T19:00:00Z");
    const files = [
      { kind: "EDITED", filename: "cut.mp4", createdAt: cut },
      { kind: "REFERENCE", filename: "font.png", createdAt: after },
      { kind: "REFERENCE", filename: "old.jpg", createdAt: before },
      { kind: "REFERENCE", filename: "clip.mp4", createdAt: after },
    ];
    const split = shotsForFix(files, true);
    expect(split.fix.map((file) => file.filename)).toEqual(["font.png"]);
    expect(split.earlier.map((file) => file.filename)).toEqual(["old.jpg"]);
    expect(shotsForFix(files, false).fix).toEqual([]);
  });

  it("an empty fix leaves the brief alone", () => {
    expect(withChangeNote("Fix: old ask\n\nKeep the drawer shot", "")).toBe("Keep the drawer shot");
    expect(splitChangeNote("Keep the drawer shot")).toEqual({ fix: "", brief: "Keep the drawer shot" });
    expect(withChangeNote("", "Bigger captions")).toBe("Fix: Bigger captions");
  });
});
