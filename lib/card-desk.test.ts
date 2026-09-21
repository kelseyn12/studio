import { describe, expect, it } from "vitest";
import { deskStage, nextStatusFor, pickFinished, sendBackStatus } from "@/lib/card-desk";

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
