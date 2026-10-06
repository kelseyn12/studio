import { describe, expect, it } from "vitest";
import { withVoiceTranscript } from "@/lib/voice-note";

describe("withVoiceTranscript", () => {
  it("replaces the last voice take and keeps the note above it", () => {
    expect(withVoiceTranscript("Use take 2\n\nVoice: old take", "new take")).toBe("Use take 2\n\nVoice: new take");
    expect(withVoiceTranscript("Voice: old take\n\nVoice: second", "third")).toBe("Voice: third");
    expect(withVoiceTranscript("", "hello")).toBe("Voice: hello");
  });
});
