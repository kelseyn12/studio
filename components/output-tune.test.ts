import { describe, expect, it } from "vitest";
import { nextPanel } from "@/components/output-tune";

describe("nextPanel", () => {
  it("keeps Words + music available after you open Cover", () => {
    expect(nextPanel("off", "cover")).toBe("cover");
    expect(nextPanel("cover", "tune")).toBe("tune");
    expect(nextPanel("cover", "cover")).toBe("off");
  });
});
