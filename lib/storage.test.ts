import { describe, expect, it } from "vitest";
import { fileMaxBytes, formatBytes, rejectStudioFile, studioUsage, STUDIO_FILE_MAX_BYTES, WARN_R2_BYTES } from "@/lib/storage";

describe("storage caps", () => {
  it("rejects a camera-day sized clip", () => {
    expect(rejectStudioFile(STUDIO_FILE_MAX_BYTES + 1, "RAW")).toMatch(/Drive/);
    expect(rejectStudioFile(12 * 1024 * 1024, "RAW")).toBeNull();
    expect(rejectStudioFile(41 * 1024 * 1024, "VOICE")).toMatch(/40MB/);
  });

  it("reads the per-file cap from the environment with a 1GB default", () => {
    expect(fileMaxBytes(undefined)).toBe(1024 * 1024 * 1024);
    expect(fileMaxBytes("250")).toBe(250 * 1024 * 1024);
    expect(fileMaxBytes("nope")).toBe(1024 * 1024 * 1024);
    expect(fileMaxBytes("0")).toBe(1024 * 1024 * 1024);
  });

  it("flags the free R2 slice before it fills", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(studioUsage(WARN_R2_BYTES).hot).toBe(true);
    expect(studioUsage(0).hot).toBe(false);
  });
});
