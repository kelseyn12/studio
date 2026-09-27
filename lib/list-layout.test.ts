import { describe, expect, it } from "vitest";
import { listRows, listStack, lookPaint, sharedListPlan, wordBoxClass } from "@/lib/list-layout";

describe("listStack", () => {
  it("keeps body words on the hook number rows", () => {
    const hook = listStack({ style: "tiktok", headline: "I gave two AIs one job", x: 0.5, y: 0.2, count: 5 });
    const body = listStack({ style: "tiktok", headline: "", count: 3, stack: hook });
    expect(body).toEqual(hook);
    const hookRows = listRows(hook, 5);
    const bodyRows = listRows(body, 3);
    expect(bodyRows[0]).toEqual(hookRows[0]);
    expect(bodyRows[2]).toEqual(hookRows[2]);
  });

  it("plans hook numbers from Mix plus the longest typed list", () => {
    const plan = sharedListPlan({
      style: "tiktok",
      headline: "Hello",
      x: 0.5,
      y: 0.2,
      hookList: 5,
      itemCounts: [0, 3],
    });
    expect(plan.count).toBe(5);
    expect(plan.stack).toEqual(listStack({ style: "tiktok", headline: "Hello", x: 0.5, y: 0.2, count: 5 }));
  });

  it("paints a plate only when box is on", () => {
    expect(lookPaint("tiktok").borderStyle).toBe(1);
    expect(lookPaint("instagram").outline).toBe(4);
    expect(lookPaint("tiktok").outline).toBe(5);
    expect(lookPaint("tiktok", true)).toEqual({ borderStyle: 3, outline: 12, shadow: 0 });
    expect(lookPaint("instagram", true)).toEqual({ borderStyle: 3, outline: 8, shadow: 0 });
    expect(wordBoxClass("tiktok", true)).toContain("rounded-[5px]");
    expect(wordBoxClass("instagram", true)).toContain("rounded-[4px]");
    expect(wordBoxClass("tiktok", "white")).toContain("bg-white");
    expect(wordBoxClass("tiktok", "white")).toContain("text-black");
  });
});
