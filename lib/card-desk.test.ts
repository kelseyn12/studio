import { describe, expect, it } from "vitest";
import { deskStage, nextStatusFor, sendBackStatus } from "@/lib/card-desk";

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
});
