import { describe, expect, it } from "vitest";
import { localRoot, UPLOAD_ROOT } from "@/lib/files";
import { hasR2, r2PublicUrl } from "@/lib/r2";

const R2_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
] as const;

function snapshotR2() {
  return Object.fromEntries(R2_KEYS.map((key) => [key, process.env[key]]));
}

function restoreR2(previous: Record<string, string | undefined>) {
  for (const key of R2_KEYS) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
}

describe("r2", () => {
  it("stays off without credentials", () => {
    const previous = snapshotR2();
    for (const key of R2_KEYS) delete process.env[key];
    expect(hasR2()).toBe(false);
    expect(localRoot()).toBe(UPLOAD_ROOT);
    restoreR2(previous);
  });

  it("turns on when the four keys exist", () => {
    const previous = snapshotR2();
    process.env.R2_ACCOUNT_ID = "acct";
    process.env.R2_ACCESS_KEY_ID = "key";
    process.env.R2_SECRET_ACCESS_KEY = "secret";
    process.env.R2_BUCKET = "studio";
    expect(hasR2()).toBe(true);
    restoreR2(previous);
  });

  it("joins a public base and key", () => {
    const previous = process.env.R2_PUBLIC_URL;
    process.env.R2_PUBLIC_URL = "https://files.example.com/";
    expect(r2PublicUrl("cards/a.mp4")).toBe("https://files.example.com/cards/a.mp4");
    if (previous === undefined) delete process.env.R2_PUBLIC_URL;
    else process.env.R2_PUBLIC_URL = previous;
  });
});
