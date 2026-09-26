import { describe, expect, it } from "vitest";
import { pickForLook } from "@/lib/card-desk";
import { hookLooks } from "@/lib/text-style";

const at = (minutes: number) => new Date(2026, 8, 26, 12, minutes);

describe("pickForLook", () => {
  const generated = [
    { id: "ig", kind: "GENERATED", textStyle: "instagram", createdAt: at(1) },
    { id: "tt", kind: "GENERATED", textStyle: "tiktok", createdAt: at(1) },
  ];

  it("ships the file built in that look", () => {
    expect(pickForLook(generated, "instagram")?.id).toBe("ig");
    expect(pickForLook(generated, "tiktok")?.id).toBe("tt");
  });

  it("lets the editor's cut win for every look", () => {
    const withEdit = [...generated, { id: "edit", kind: "EDITED", textStyle: "", createdAt: at(5) }];
    expect(pickForLook(withEdit, "instagram")?.id).toBe("edit");
    expect(pickForLook(withEdit, "tiktok")?.id).toBe("edit");
  });

  it("falls back to the newest finished file when no look matches", () => {
    const single = [{ id: "one", kind: "GENERATED", textStyle: "plain", createdAt: at(1) }];
    expect(pickForLook(single, "tiktok")?.id).toBe("one");
    expect(pickForLook([], "tiktok")).toBeUndefined();
  });
});

describe("hookLooks", () => {
  it("builds one file per look only when text is on and the deal spans looks", () => {
    expect(hookLooks("auto", ["instagram", "tiktok"], true)).toEqual(["instagram", "tiktok"]);
    expect(hookLooks("auto", ["instagram", "tiktok"], false)).toEqual(["tiktok"]);
    expect(hookLooks("auto", ["instagram", "facebook"], true)).toEqual(["instagram"]);
    expect(hookLooks("tiktok", ["instagram", "tiktok"], true)).toEqual(["tiktok"]);
    expect(hookLooks("auto", [], true)).toEqual(["plain"]);
  });
});
