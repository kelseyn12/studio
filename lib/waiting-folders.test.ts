import { describe, expect, it } from "vitest";
import { groupWaitingFolders, waitingFolderName, waitingMixLabel } from "@/lib/waiting-folders";

const polsia = "Polsia Millionaire · mix 2 · copy_125C5970-0413-468F-B46E-DA2507B";

describe("waitingFolderName", () => {
  it("uses the batch name you typed", () => {
    expect(waitingFolderName({ title: polsia, batch: "Polsia Millionaire", deal: "Polsia" })).toBe(
      "Polsia Millionaire",
    );
  });

  it("reads the batch from the title when the batch link is gone", () => {
    expect(waitingFolderName({ title: polsia, batch: "", deal: "Polsia" })).toBe("Polsia Millionaire");
  });

  it("uses the deal for a video that was not a mix", () => {
    expect(waitingFolderName({ title: "Fridge filter", batch: "", deal: "Sitescout" })).toBe("Sitescout");
  });
});

describe("waitingMixLabel", () => {
  it("hides the file name and keeps the mix number", () => {
    expect(waitingMixLabel(polsia, "copy_125C5970-0413-468F-B46E-DA2507B.MP4")).toBe("Mix 2");
  });

  it("keeps hook words you wrote", () => {
    expect(waitingMixLabel("This week · mix 6 · BANGER", "BANGER")).toBe("Mix 6 · BANGER");
  });
});

describe("groupWaitingFolders", () => {
  it("puts one batch in a folder and orders the mixes", () => {
    const folders = groupWaitingFolders([
      { id: "b", title: "Polsia Millionaire · mix 12 · copy_aaa", hook: "", batch: "Polsia Millionaire", deal: "Polsia" },
      { id: "a", title: "Polsia Millionaire · mix 2 · copy_bbb", hook: "", batch: "Polsia Millionaire", deal: "Polsia" },
      { id: "c", title: "IG reaction", hook: "", batch: "", deal: "Sitescout" },
    ]);
    expect(folders.map((folder) => folder.title)).toEqual(["Polsia Millionaire", "Sitescout"]);
    expect(folders[0].cards.map((card) => card.mixLabel)).toEqual(["Mix 2", "Mix 12"]);
  });
});
