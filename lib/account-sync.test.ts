import { fieldsFromSync } from "@/lib/account-sync";
import { describe, expect, it } from "vitest";

describe("fieldsFromSync", () => {
  it("keeps a saved label when the account is already in Studio", () => {
    expect(
      fieldsFromSync({ username: "buildwithkelso", network: "instagram", nickname: "buildwithkelso", isActive: 1 }, true),
    ).toEqual({ username: "buildwithkelso", network: "instagram", isActive: true });
  });

  it("uses Outstand's name only the first time an account arrives", () => {
    expect(
      fieldsFromSync({ username: "buildwithkelso", network: "facebook", nickname: "Build with Kelso", isActive: 1 }, false)
        .nickname,
    ).toBe("Build with Kelso");
  });
});
