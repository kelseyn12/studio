import { describe, expect, it } from "vitest";
import { parseTranscript, TRANSCRIBE_MODEL } from "@/lib/whisper";

describe("Whisper parser", () => {
  it("reads text from a whisper payload", () => {
    expect(parseTranscript({ text: "open on the result" })).toBe("open on the result");
  });

  it("uses the current OpenAI transcribe model", () => {
    expect(TRANSCRIBE_MODEL).toBe("gpt-4o-transcribe");
  });
});

describe("Whisper parser", () => {
  it("reads text from a whisper payload", () => {
    expect(parseTranscript({ text: "open on the result" })).toBe("open on the result");
  });
});
