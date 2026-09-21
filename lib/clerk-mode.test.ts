import { describe, expect, it } from "vitest";
import { hasClerk, parseStudioRole } from "@/lib/clerk-mode";

describe("clerk mode", () => {
  it("is off without both keys", () => {
    const secret = process.env.CLERK_SECRET_KEY;
    const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    delete process.env.CLERK_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    expect(hasClerk()).toBe(false);
    process.env.CLERK_SECRET_KEY = secret;
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = publishable;
  });

  it("only accepts studio roles", () => {
    expect(parseStudioRole("EDITOR")).toBe("EDITOR");
    expect(parseStudioRole("admin")).toBeNull();
  });
});
