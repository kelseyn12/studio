import { describe, expect, it } from "vitest";
import {
  isNoCredits,
  NO_CREDITS,
  OPENAI_BILLING_URL,
  openAiFailStatus,
  openAiUserError,
  parseTranscript,
  TRANSCRIBE_MODEL,
} from "@/lib/whisper";

describe("Whisper parser", () => {
  it("reads text from a whisper payload", () => {
    expect(parseTranscript({ text: "open on the result" })).toBe("open on the result");
  });

  it("uses the current OpenAI transcribe model", () => {
    expect(TRANSCRIBE_MODEL).toBe("gpt-4o-transcribe");
  });
});

describe("OpenAI billing errors", () => {
  it("recognizes the clipped Multiply warning and the full one", () => {
    expect(isNoCredits("You have no credits remaining. Add credits to continue using the API at https://")).toBe(true);
    expect(
      isNoCredits("You have no credits remaining. Add credits to continue using the API at https://platform.openai.com/settings/organization/billing"),
    ).toBe(true);
    expect(isNoCredits(NO_CREDITS)).toBe(true);
    expect(isNoCredits("Spoken words on screen needs OPENAI_API_KEY")).toBe(false);
  });

  it("stores a short status and keeps the billing URL for people", () => {
    expect(openAiFailStatus(new Error("You have no credits remaining. Add credits at https://platform.openai.com/x"))).toBe(
      NO_CREDITS,
    );
    expect(openAiUserError(NO_CREDITS)).toContain(OPENAI_BILLING_URL);
    expect(openAiFailStatus(new Error("ffmpeg missing drawtext")).length).toBeLessThanOrEqual(160);
  });
});
