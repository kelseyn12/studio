import { describe, expect, it } from "vitest";
import { pickCombos, pickTracks, product } from "@/lib/combinations";

describe("product", () => {
  it("multiplies hook x demo x cta", () => {
    const combos = product([
      ["h1", "h2"],
      ["d1"],
      ["c1", "c2"],
    ]);
    expect(combos).toHaveLength(4);
  });

  it("skips an empty slot", () => {
    expect(product([["h1"], [], ["c1"]])).toEqual([["h1", "c1"]]);
  });
});

describe("pickCombos", () => {
  it("caps random runs to the asked count", () => {
    const picked = pickCombos([[1, 2], [3, 4]], 2, false);
    expect(picked).toHaveLength(2);
    const allowed = new Set(["1,3", "1,4", "2,3", "2,4"]);
    for (const row of picked) expect(allowed.has(row.join(","))).toBe(true);
  });
});

describe("pickTracks", () => {
  it("gives each video a track and uses every song before repeating", () => {
    const picked = pickTracks(["a", "b", "c"], 6);
    expect(picked).toHaveLength(6);
    expect(new Set(picked.slice(0, 3)).size).toBe(3);
    expect(picked.every(Boolean)).toBe(true);
  });

  it("skips music when the list is empty", () => {
    expect(pickTracks([], 3)).toEqual([undefined, undefined, undefined]);
  });
});
