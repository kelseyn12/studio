import { wrapHook, type DrawnStyle } from "@/lib/text-style";
import { LIST_MAX } from "@/lib/variations";

export const FRAME_W = 1080;
export const FRAME_H = 1920;
export const LIST_LEFT = 90;

export type LookMetrics = { fontsize: number; top: number; lineGap: number };
export type ListStack = { left: number; top: number; gap: number };

/** App text-tool sizes on 1080×1920. TikTok Classic sits bigger; Reels Classic is a bit tighter. */
export const LOOK_METRICS: Record<DrawnStyle, LookMetrics> = {
  tiktok: { fontsize: 82, top: 0.17, lineGap: 1.12 },
  instagram: { fontsize: 76, top: 0.14, lineGap: 1.16 },
  plain: { fontsize: 84, top: 0.12, lineGap: 1.12 },
};

export function lookPaint(style: DrawnStyle, box?: boolean): { borderStyle: 1 | 3; outline: number; shadow: number } {
  if (box) return { borderStyle: 3, outline: 16, shadow: 0 };
  if (style === "instagram") return { borderStyle: 1, outline: 5, shadow: 1 };
  if (style === "tiktok") return { borderStyle: 1, outline: 5, shadow: 2 };
  return { borderStyle: 1, outline: 6, shadow: 0 };
}

export function clampListCount(count: number): number {
  return Math.min(LIST_MAX, Math.max(0, Math.floor(count)));
}

/** Shared number rows so body words land on the hook's 1. 2. 3. */
export function listStack(input: {
  style: DrawnStyle;
  headline?: string;
  x?: number;
  y?: number;
  count: number;
  stack?: ListStack;
}): ListStack {
  if (input.stack) return input.stack;
  const look = LOOK_METRICS[input.style];
  const count = clampListCount(input.count) || 1;
  const placed = Number.isFinite(input.x) && Number.isFinite(input.y);
  const py = Math.round(FRAME_H * Math.min(0.88, Math.max(0.08, input.y ?? look.top)));
  const marginV = placed ? 0 : Math.round(FRAME_H * look.top);
  const lines = wrapHook(input.headline ?? "");
  const lineHeight = look.fontsize * look.lineGap;
  const top = (input.headline ?? "").trim()
    ? (placed ? py : marginV) + Math.round(Math.max(lines.length, 1) * lineHeight) + 80
    : Math.round(FRAME_H * look.top);
  return { left: LIST_LEFT, top, gap: Math.min(140, Math.floor((FRAME_H * 0.62 - top) / count)) };
}

export function sharedListPlan(input: {
  style: DrawnStyle;
  headline?: string;
  x?: number;
  y?: number;
  hookList?: number;
  itemCounts: number[];
}): { count: number; stack?: ListStack } {
  const count = clampListCount(Math.max(input.hookList ?? 0, ...input.itemCounts, 0));
  return {
    count,
    stack: count
      ? listStack({ style: input.style, headline: input.headline, x: input.x, y: input.y, count })
      : undefined,
  };
}

export function listRows(stack: ListStack, count: number): Array<{ x: number; y: number }> {
  return Array.from({ length: clampListCount(count) }, (_, index) => ({
    x: stack.left / FRAME_W,
    y: (stack.top + index * stack.gap) / FRAME_H,
  }));
}
