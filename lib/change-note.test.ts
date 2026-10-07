import { describe, expect, it } from "vitest";
import { splitChangeNote, withChangeNote } from "@/lib/change-note";

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

  it("an empty fix leaves the brief alone", () => {
    expect(withChangeNote("Fix: old ask\n\nKeep the drawer shot", "")).toBe("Keep the drawer shot");
    expect(splitChangeNote("Keep the drawer shot")).toEqual({ fix: "", brief: "Keep the drawer shot" });
    expect(withChangeNote("", "Bigger captions")).toBe("Fix: Bigger captions");
  });
});
