import { connectUrl } from "@/lib/outstand";
import { describe, expect, it } from "vitest";

describe("connectUrl", () => {
  it("asks the network to show every account again", () => {
    process.env.OUTSTAND_ORG_ID = "org_test";
    const url = new URL(connectUrl("facebook", "http://localhost:3000/connections/callback"));
    expect(url.pathname).toContain("/facebook/");
    expect(url.searchParams.get("force_account_selection")).toBe("true");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/connections/callback");
  });
});
