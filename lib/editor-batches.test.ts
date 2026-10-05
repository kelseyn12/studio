import { describe, expect, it } from "vitest";
import {
  groupEditorBatches,
  lookInFileName,
  matchDropToCard,
  mixNumberIn,
  neededLooks,
  wordsSheet,
} from "@/lib/editor-batches";

describe("groupEditorBatches", () => {
  const accounts = [
    { network: "instagram", isActive: true, campaignId: "polsia" },
    { network: "tiktok", isActive: true, campaignId: "polsia" },
  ];
  const card = (id: string, title: string, status: string) => ({
    id,
    title,
    hook: "Hook words",
    body: "",
    plug: "Go do it",
    status,
    campaignId: "polsia",
    campaign: { name: "Polsia" },
    assets: [
      { kind: "GENERATED", textStyle: "plain", path: `cards/${id}/clean.mp4`, filename: `${title}.mp4` },
      ...(id === "two" ? [{ kind: "EDITED", textStyle: "tiktok", path: "x", filename: "x.mp4" }] : []),
    ],
  });

  it("folders batch videos by name with words, needs, and clean files; leaves the rest loose", () => {
    const names = new Map([
      ["one", "Polsia Millionaire"],
      ["two", "Polsia Millionaire"],
    ]);
    const { folders, loose } = groupEditorBatches(
      [card("two", "Polsia Millionaire · mix 2 · copy_1", "EDITING"), card("one", "Polsia Millionaire · mix 1 · copy_1", "REVIEW"), card("solo", "Reaction 1", "EDITING")],
      accounts,
      names,
    );
    expect(loose.map((row) => row.id)).toEqual(["solo"]);
    expect(folders).toHaveLength(1);
    expect(folders[0].name).toBe("Polsia Millionaire");
    expect(folders[0].rows.map((row) => [row.id, row.mixLabel, row.stage])).toEqual([
      ["one", "Mix 1 · Hook words", "review"],
      ["two", "Mix 2 · Hook words", "cutting"],
    ]);
    expect(folders[0].rows[1].words).toEqual([
      { label: "Hook", words: "Hook words" },
      { label: "CTA", words: "Go do it" },
    ]);
    expect(folders[0].rows[1].needs.map((need) => [need.tag, need.done])).toEqual([
      ["IG · FB", false],
      ["TT · YT", true],
    ]);
    expect(folders[0].rows[1].cleanFiles).toEqual([
      { path: "cards/two/clean.mp4", filename: "Polsia Millionaire · mix 2 · copy_1.mp4" },
    ]);
  });
});

describe("wordsSheet", () => {
  it("lists hook, body, and CTA words and skips empty ones", () => {
    expect(wordsSheet({ hook: "WORST birthday months", body: "", plug: "Try Polsia" })).toEqual([
      { label: "Hook", words: "WORST birthday months" },
      { label: "CTA", words: "Try Polsia" },
    ]);
    expect(wordsSheet({ hook: "  ", body: "", plug: "" })).toEqual([]);
  });
});

describe("neededLooks", () => {
  it("asks for two files when the deal spans Instagram and TikTok", () => {
    expect(neededLooks(["instagram", "facebook", "tiktok", "youtube"], [])).toEqual([
      { look: "instagram", tag: "IG · FB", done: false },
      { look: "tiktok", tag: "TT · YT", done: false },
    ]);
  });

  it("marks a look done once its file is dropped", () => {
    const looks = neededLooks(["instagram", "tiktok"], ["tiktok"]);
    expect(looks.map((look) => look.done)).toEqual([false, true]);
  });

  it("asks for one file for every app when there is one app family", () => {
    expect(neededLooks(["tiktok", "youtube"], [])).toEqual([{ look: "plain", tag: "Every app", done: false }]);
    expect(neededLooks([], ["plain"])[0].done).toBe(true);
  });
});

describe("matchDropToCard", () => {
  const cards = [
    { id: "a", title: "Polsia Millionaire · mix 2 · copy_125C" },
    { id: "b", title: "Polsia Millionaire · mix 12 · copy_125C" },
  ];

  it("reads the mix number and the look from the file name", () => {
    expect(mixNumberIn("polsia mix 12 TT.mp4")).toBe(12);
    expect(mixNumberIn("Mix_2-IG.mov")).toBe(2);
    expect(mixNumberIn("final export.mp4")).toBeNull();
    expect(lookInFileName("mix 2 IG.mp4")).toBe("instagram");
    expect(lookInFileName("Polsia-Millionaire-mix-2-TT-YT.mp4")).toBe("tiktok");
    expect(lookInFileName("mix 2.mp4")).toBe("plain");
  });

  it("pairs a file with the right video and never with mix 1 when it says 12", () => {
    expect(matchDropToCard("mix 12 tt.mp4", cards)).toEqual({ card: cards[1], textStyle: "tiktok" });
    expect(matchDropToCard("mix 2.mp4", cards)).toEqual({ card: cards[0], textStyle: "plain" });
    expect(matchDropToCard("mix 7.mp4", cards)).toBeNull();
    expect(matchDropToCard("export.mp4", cards)).toBeNull();
  });
});
