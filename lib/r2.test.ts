import { describe, expect, it } from "vitest";
import { localRoot, UPLOAD_ROOT } from "@/lib/files";
import { hasR2, r2PublicUrl } from "@/lib/r2";

describe("r2", () => {
  it("stays off without credentials", () => {
    expect(hasR2()).toBe(false);
    expect(localRoot()).toBe(UPLOAD_ROOT);
  });

  it("joins a public base and key", () => {
    const previous = process.env.R2_PUBLIC_URL;
    process.env.R2_PUBLIC_URL = "https://files.example.com/";
    expect(r2PublicUrl("cards/a.mp4")).toBe("https://files.example.com/cards/a.mp4");
    if (previous === undefined) delete process.env.R2_PUBLIC_URL;
    else process.env.R2_PUBLIC_URL = previous;
  });
});
