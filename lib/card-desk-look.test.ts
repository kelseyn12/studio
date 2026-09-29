import { describe, expect, it } from "vitest";
import { pickForLook, shipLooks, waitingLooks } from "@/lib/card-desk";
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

describe("shipLooks", () => {
  const generated = [
    { id: "ig", kind: "GENERATED", textStyle: "instagram", createdAt: at(1) },
    { id: "tt", kind: "GENERATED", textStyle: "tiktok", createdAt: at(1) },
  ];

  it("splits IG · FB and TT · YT onto their own files", () => {
    const rows = shipLooks(generated, [
      { network: "instagram" },
      { network: "facebook" },
      { network: "tiktok" },
      { network: "youtube" },
    ]);
    expect(rows.map((row) => [row.tag, row.asset.id, row.accounts.map((account) => account.network)])).toEqual([
      ["IG · FB", "ig", ["instagram", "facebook"]],
      ["TT · YT", "tt", ["tiktok", "youtube"]],
    ]);
  });

  it("still lists both files when no accounts are picked yet", () => {
    expect(shipLooks(generated, []).map((row) => row.tag)).toEqual(["IG · FB", "TT · YT"]);
  });
});

describe("waitingLooks", () => {
  const generated = [
    { kind: "GENERATED", textStyle: "instagram" },
    { kind: "GENERATED", textStyle: "tiktok" },
  ];

  it("says where each file posts, per look", () => {
    const lines = waitingLooks(generated, [
      { network: "instagram", username: "polsia" },
      { network: "facebook", username: "polsia.fb" },
      { network: "youtube", username: "@kelso" },
    ]);
    expect(lines).toEqual([
      { tag: "IG · FB", who: "IG @polsia · FB @polsia.fb" },
      { tag: "TT · YT", who: "YT @kelso" },
    ]);
  });

  it("leaves who empty when no checked account takes that look", () => {
    const lines = waitingLooks(generated, [{ network: "instagram", username: "polsia" }]);
    expect(lines[1]).toEqual({ tag: "TT · YT", who: "" });
  });

  it("shows every account on an editor-only or plain video", () => {
    const lines = waitingLooks([{ kind: "EDITED", textStyle: "" }], [{ network: "instagram", username: "polsia" }]);
    expect(lines).toEqual([{ tag: "All apps", who: "IG @polsia" }]);
  });
});

describe("hookLooks", () => {
  it("builds one file per look only when text is on and the deal spans looks", () => {
    expect(hookLooks("auto", ["instagram", "tiktok"], true)).toEqual(["instagram", "tiktok"]);
    expect(hookLooks("auto", ["instagram", "tiktok"], false)).toEqual(["tiktok"]);
    expect(hookLooks("auto", ["instagram", "facebook"], true)).toEqual(["instagram"]);
    expect(hookLooks("tiktok", ["instagram", "tiktok"], true)).toEqual(["tiktok"]);
    expect(hookLooks("both", ["facebook"], true)).toEqual(["instagram", "tiktok"]);
    expect(hookLooks("both", ["tiktok"], false)).toEqual(["tiktok"]);
    expect(hookLooks("auto", [], true)).toEqual(["plain"]);
  });
});
