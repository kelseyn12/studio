import { describe, expect, it } from "vitest";
import { pickCombos, product } from "@/lib/combinations";

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
  it("caps random runs", () => {
    expect(pickCombos([[1, 2], [3, 4]], 2, false)).toHaveLength(2);
  });
});
