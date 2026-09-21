import { describe, expect, it } from "vitest";
import { setupSteps } from "@/lib/setup";

describe("setupSteps", () => {
  it("marks steps done from counts", () => {
    const steps = setupSteps({
      accounts: 3,
      deals: 0,
      formats: 0,
      clips: 5,
      videos: 1,
      editors: 0,
      outstand: true,
    });
    const byId = Object.fromEntries(steps.map((step) => [step.id, step.done]));
    expect(byId).toEqual({
      accounts: true,
      deal: false,
      formats: false,
      clips: true,
      video: true,
      editor: false,
      outstand: true,
    });
  });

  it("is fully done when everything exists", () => {
    const steps = setupSteps({
      accounts: 1,
      deals: 1,
      formats: 1,
      clips: 1,
      videos: 1,
      editors: 1,
      outstand: true,
    });
    expect(steps.every((step) => step.done)).toBe(true);
  });
});
