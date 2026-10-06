import { describe, expect, it } from "vitest";
import { alreadyWithEditor, deskStage, filmChipLabel, nextStatusFor, pickFinished, sendBackStatus } from "@/lib/card-desk";
import { pillLabel } from "@/lib/pipeline";

describe("filmChipLabel", () => {
  it("drops the batch prefix so a day cell can show the mix", () => {
    expect(filmChipLabel("This week · mix 6 · BANGER 💥")).toBe("Mix 6 · BANGER 💥");
    expect(filmChipLabel("Fridge filter")).toBe("Fridge filter");
  });
});

describe("pillLabel", () => {
  it("says Scheduled only after a day is set", () => {
    expect(pillLabel("READY", new Date("2026-09-30T15:00:00.000Z"))).toBe("Scheduled");
    expect(pillLabel("READY", null)).toBe("To schedule");
    expect(pillLabel("POSTED", new Date())).toBe("Posted");
  });
});

describe("card desk", () => {
  it("keeps publish off the card until a file exists", () => {
    expect(deskStage("IDEA")).toBe("brief");
    expect(deskStage("SCRIPTED")).toBe("footage");
    expect(deskStage("FILMED")).toBe("editor");
    expect(deskStage("REVIEW")).toBe("live");
    expect(deskStage("READY")).toBe("live");
    expect(deskStage("POSTED")).toBe("live");
  });

  it("advances one room at a time", () => {
    expect(nextStatusFor("brief", "IDEA")).toBe("SCRIPTED");
    expect(nextStatusFor("footage", "SCRIPTED")).toBe("FILMED");
    expect(nextStatusFor("editor", "FILMED")).toBe("EDITING");
    expect(nextStatusFor("live", "READY")).toBeNull();
  });

  it("pings the editor once when the video is first sent", () => {
    const sent = { status: "EDITING", cutBy: "EDITOR", editorId: "tarikh" };
    expect(alreadyWithEditor(null, "tarikh")).toBe(false);
    expect(alreadyWithEditor({ status: "FILMED", cutBy: "SELF", editorId: "tarikh" }, "tarikh")).toBe(false);
    expect(alreadyWithEditor(sent, "tarikh")).toBe(true);
    expect(alreadyWithEditor(sent, "kelso")).toBe(false);
  });

  it("sends a cut back to the editor from To approve", () => {
    expect(sendBackStatus("REVIEW")).toBe("EDITING");
    expect(sendBackStatus("READY")).toBeNull();
  });

  it("ships the newest editor cut, not the first one", () => {
    const day = (offset: number) => new Date(2026, 8, offset + 1);
    const assets = [
      { kind: "GENERATED", createdAt: day(0), label: "machine" },
      { kind: "EDITED", createdAt: day(1), label: "first cut" },
      { kind: "RAW", createdAt: day(2), label: "clip" },
      { kind: "EDITED", createdAt: day(3), label: "revision" },
    ];
    expect(pickFinished(assets)?.label).toBe("revision");
  });

  it("falls back to the generated video when no editor cut exists", () => {
    const assets = [
      { kind: "RAW", createdAt: new Date(2026, 8, 1) },
      { kind: "GENERATED", createdAt: new Date(2026, 8, 2) },
    ];
    expect(pickFinished(assets)?.kind).toBe("GENERATED");
    expect(pickFinished([])).toBeUndefined();
  });
});
