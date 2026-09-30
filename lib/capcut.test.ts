import { describe, expect, it } from "vitest";
import { capcutHref } from "@/lib/capcut";

describe("capcutHref", () => {
  it("keeps a CapCut https link and drops everything else", () => {
    expect(capcutHref("https://www.capcut.com/team/abc")).toBe("https://www.capcut.com/team/abc");
    expect(capcutHref("http://www.capcut.com/team/abc")).toBeNull();
    expect(capcutHref("https://youtube.com/watch?v=nkaVTWbF5wI")).toBeNull();
  });
});
