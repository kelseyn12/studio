import { describe, expect, it } from "vitest";
import { chooseDay } from "@/lib/day-picks";

describe("chooseDay", () => {
  it("lets this day take a mix and clears it off any other day", () => {
    expect(chooseDay({ "2026-09-28": "mix-5" }, "2026-09-27", "mix-5")).toEqual({
      "2026-09-27": "mix-5",
    });
  });

  it("leaves other days alone when the mix is new", () => {
    expect(chooseDay({ "2026-09-28": "mix-2" }, "2026-09-27", "mix-5")).toEqual({
      "2026-09-27": "mix-5",
      "2026-09-28": "mix-2",
    });
  });
});
