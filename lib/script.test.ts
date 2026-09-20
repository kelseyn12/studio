import { describe, expect, it } from "vitest";
import { parseScript, scriptPrompt } from "@/lib/script";

describe("generate script", () => {
  it("asks for spoken lines, not a concept memo", () => {
    const prompt = scriptPrompt({
      title: "Fridge filter",
      premise: "water tastes clean",
      hook: "",
      body: "",
      plug: "",
      script: "",
      brand: "Brita",
      referenceUrl: "",
      referenceTranscript: "wait until you try this filter",
    });
    expect(prompt).toContain("spoken UGC");
    expect(prompt).not.toContain("Video Concept");
    expect(prompt).toContain("What the reference says");
  });

  it("reads JSON from chat completions", () => {
    const out = parseScript({
      choices: [
        {
          message: {
            content: '{"hook":"Stop buying bottled water.","body":"This filter clicks on.","plug":"Link in bio.","script":"Stop buying bottled water. [hold the fridge] This filter clicks on. Link in bio."}',
          },
        },
      ],
    });
    expect(out.hook).toBe("Stop buying bottled water.");
    expect(out.script).toContain("[hold the fridge]");
  });
});
