import { describe, expect, it } from "vitest";
import { uniqueIds } from "@/lib/drop-cards";

describe("uniqueIds", () => {
  it("drops blanks and repeats, keeps first-seen order", () => {
    expect(uniqueIds([" a ", "", "a", "b", "b"])).toEqual(["a", "b"]);
  });
});
