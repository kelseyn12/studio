import { describe, expect, it } from "vitest";
import { discordMessage } from "@/lib/discord";

describe("discordMessage", () => {
  const ids = { editor: "111", creator: "222" };

  it("mentions the editor and adds the Cuts link", () => {
    expect(discordMessage("editor", "New job: mix 2. Open Cuts.", ids)).toBe(
      "<@111> New job: mix 2. Open Cuts. https://system-studio.fly.dev/edits",
    );
  });

  it("mentions you when a cut is ready, and does not double a link", () => {
    expect(discordMessage("creator", "Ready https://example.com", ids)).toBe("<@222> Ready https://example.com");
  });

  it("still posts when an id is missing", () => {
    expect(discordMessage("editor", "New job.", {})).toBe("New job. https://system-studio.fly.dev/edits");
  });
});
