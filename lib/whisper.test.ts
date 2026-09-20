import { describe, expect, it } from "vitest";
import { parseTranscript } from "@/lib/whisper";

describe("Whisper parser", () => {
  it("reads text from a whisper payload", () => {
    expect(parseTranscript({ text: "open on the result" })).toBe("open on the result");
  });
});
