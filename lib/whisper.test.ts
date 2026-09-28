import { describe, expect, it } from "vitest";
import {
  audioForListen,
  dropListenFile,
  isListenTooBig,
  isNoCredits,
  LISTEN_TOO_BIG,
  NO_CREDITS,
  OPENAI_BILLING_URL,
  openAiFailStatus,
  openAiUserError,
  parseTranscript,
  TRANSCRIBE_MODEL,
  WHISPER_FILE_MAX_BYTES,
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

  it("maps Whisper's 25 MB upload cap instead of showing the 413", () => {
    const raw = "Maximum content size limit (26214400) exceeded (26403541 bytes read)";
    expect(isListenTooBig(raw)).toBe(true);
    expect(openAiFailStatus(new Error(raw))).toBe(LISTEN_TOO_BIG);
    expect(openAiUserError(raw)).toMatch(/25 MB/);
  });
});

describe("audioForListen", () => {
  it(
    "pulls a small mp3 from a video so Whisper never sees the 25 MB cap",
    async () => {
      const { mkdtemp, rm, stat } = await import("fs/promises");
      const os = await import("os");
      const path = await import("path");
      const { runFfmpeg } = await import("@/lib/ffmpeg");
      const dir = await mkdtemp(path.join(os.tmpdir(), "studio-listen-test-"));
      const clip = path.join(dir, "body.mp4");
      try {
        await runFfmpeg([
          "-f",
          "lavfi",
          "-i",
          "color=c=gray:s=320x240:d=1",
          "-f",
          "lavfi",
          "-i",
          "sine=frequency=440:duration=1",
          "-pix_fmt",
          "yuv420p",
          clip,
        ]);
        const mp3 = await audioForListen(clip);
        try {
          const size = (await stat(mp3)).size;
          expect(size).toBeGreaterThan(0);
          expect(size).toBeLessThan(WHISPER_FILE_MAX_BYTES);
          expect(mp3.endsWith(".mp3")).toBe(true);
        } finally {
          await dropListenFile(mp3);
        }
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
    20_000,
  );
});
