import { describe, expect, it } from "vitest";
import { fileLooks, isOneVideo, lookForNewDrop, pickForLook, pingForFinishedDrop, priorEditedIds, shipLooks, statusAfterDrop } from "@/lib/card-desk";
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

  it("lets an untagged editor cut win for every look", () => {
    const withEdit = [...generated, { id: "edit", kind: "EDITED", textStyle: "", createdAt: at(5) }];
    expect(pickForLook(withEdit, "instagram")?.id).toBe("edit");
    expect(pickForLook(withEdit, "tiktok")?.id).toBe("edit");
  });

  it("keeps an IG/FB upload off TT/YT", () => {
    const uploaded = [{ id: "ig", kind: "EDITED", textStyle: "instagram", createdAt: at(2) }];
    expect(pickForLook(uploaded, "instagram")?.id).toBe("ig");
    expect(pickForLook(uploaded, "tiktok")).toBeUndefined();
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

  it("keeps an IG-only upload on the IG row", () => {
    const rows = shipLooks([{ id: "ig", kind: "EDITED", textStyle: "instagram", createdAt: at(1) }], [
      { network: "instagram" },
      { network: "tiktok" },
    ]);
    expect(rows.map((row) => [row.tag, row.asset?.id])).toEqual([["IG · FB", "ig"]]);
  });

  it("lists every account on one video", () => {
    const rows = shipLooks(
      [
        { id: "ig", kind: "EDITED", textStyle: "instagram", createdAt: at(1) },
        { id: "one", kind: "EDITED", textStyle: "plain", createdAt: at(2) },
      ],
      [{ network: "instagram" }, { network: "facebook" }, { network: "tiktok" }, { network: "youtube" }],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.tag).toBe("All apps");
    expect(rows[0]?.asset?.id).toBe("one");
    expect(rows[0]?.accounts.map((account) => account.network)).toEqual([
      "instagram",
      "facebook",
      "tiktok",
      "youtube",
    ]);
  });
});

describe("one video", () => {
  it("treats a plain file as one video and a two-look pair as two files", () => {
    expect(isOneVideo([{ kind: "EDITED", textStyle: "plain" }])).toBe(true);
    expect(isOneVideo([{ kind: "EDITED", textStyle: "instagram" }])).toBe(false);
    expect(
      isOneVideo([
        { kind: "GENERATED", textStyle: "instagram" },
        { kind: "GENERATED", textStyle: "tiktok" },
      ]),
    ).toBe(false);
  });

  it("replaces every finished file when the drop is one video", () => {
    const assets = [
      { id: "ig", kind: "EDITED", textStyle: "instagram" },
      { id: "one", kind: "EDITED", textStyle: "plain" },
    ];
    expect(priorEditedIds(assets, "plain", "fresh")).toEqual(["ig", "one"]);
    expect(priorEditedIds(assets, "instagram", "fresh")).toEqual(["ig", "one"]);
    expect(priorEditedIds([{ id: "tt", kind: "EDITED", textStyle: "tiktok" }], "instagram", "fresh")).toEqual([]);
  });

  it("skips approve when she cuts it herself", () => {
    expect(statusAfterDrop("SELF", "FILMED")).toBe("READY");
    expect(statusAfterDrop("SELF", "REVIEW")).toBe("READY");
    expect(statusAfterDrop("SELF", "READY")).toBeNull();
    expect(statusAfterDrop("EDITOR", "EDITING")).toBe("REVIEW");
    expect(statusAfterDrop("EDITOR", "REVIEW")).toBeNull();
  });

  it("pings her only when he drops the finished file", () => {
    expect(pingForFinishedDrop("EDITOR", "EDITOR")).toBe(true);
    expect(pingForFinishedDrop("CREATOR", "SELF")).toBe(false);
    expect(pingForFinishedDrop("CREATOR", "EDITOR")).toBe(false);
  });
});

describe("lookForNewDrop", () => {
  it("starts a TT name on TT · YT and an IG name on IG · FB", () => {
    expect(lookForNewDrop("TT reaction 2 10/2")).toBe("tiktok");
    expect(lookForNewDrop("Tier list TT 10/2")).toBe("tiktok");
    expect(lookForNewDrop("IG reaction 2 10/2")).toBe("instagram");
    expect(lookForNewDrop("Tier list IG 10/2")).toBe("instagram");
  });
});

describe("fileLooks", () => {
  it("names both files on a mix, in look order", () => {
    expect(
      fileLooks([
        { kind: "GENERATED", textStyle: "tiktok" },
        { kind: "GENERATED", textStyle: "instagram" },
      ]),
    ).toEqual([
      { look: "instagram", tag: "IG · FB" },
      { look: "tiktok", tag: "TT · YT" },
    ]);
  });

  it("falls back to one all-apps row on an editor-only or plain video", () => {
    expect(fileLooks([{ kind: "EDITED", textStyle: "" }])).toEqual([{ look: "plain", tag: "All apps" }]);
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
