import { describe, expect, it } from "vitest";
import { defaultPullSince, handPostTitle, postsWorthSaving, pullMessage, pullSince } from "@/lib/hand-posts";

describe("pullMessage", () => {
  it("says how many posts landed", () => {
    expect(pullMessage("2", false)).toBe("Brought in 2 posts from the apps. Numbers includes them.");
    expect(pullMessage("0", false)).toBe("Nothing new since that date.");
    expect(pullMessage(undefined, false)).toBe("");
  });
});

describe("pullSince", () => {
  it("uses the chosen day, and ninety days when the box is empty", () => {
    const now = new Date("2026-10-05T12:00:00.000Z");
    expect(defaultPullSince(now)).toBe("2026-07-07");
    expect(pullSince("2026-09-01", now).toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(pullSince("", now).toISOString()).toBe("2026-07-07T00:00:00.000Z");
  });
});

describe("handPostTitle", () => {
  it("uses the caption, and the app plus day when the caption is blank", () => {
    expect(handPostTitle("Try it out!\nmore", "IG", null)).toBe("Try it out!");
    expect(handPostTitle("  ", "IG", new Date("2026-10-03T20:00:00.000Z"))).toBe("IG · Oct 3");
  });
});

describe("postsWorthSaving", () => {
  const since = new Date("2026-09-01T00:00:00.000Z");
  const post = (id: string, publishedAt: string | null) => ({ id, publishedAt });

  it("skips posts Studio already has, duplicates, and anything before the date", () => {
    const kept = postsWorthSaving(
      [
        post("old", "2026-08-01T00:00:00.000Z"),
        post("known", "2026-10-01T00:00:00.000Z"),
        post("new", "2026-10-02T00:00:00.000Z"),
        post("new", "2026-10-02T00:00:00.000Z"),
        post("draft", null),
      ],
      new Set(["known"]),
      since,
    );
    expect(kept.map((row) => row.id)).toEqual(["new"]);
  });
});
