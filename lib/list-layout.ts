import { wrapHook, type DrawnStyle } from "@/lib/text-style";
import { LIST_MAX } from "@/lib/variations";

export const FRAME_W = 1080;
export const FRAME_H = 1920;
export const LIST_LEFT = 90;

/**
 * TikTok / Instagram overlay on 1080×1920. Headline, logos, and marks stay in this box:
 * below the header, above the caption/music block, and left of the like/share column.
 */
export const SAFE_ZONE = { top: 0.13, bottom: 0.74, left: 0.06, right: 0.86 } as const;

export function clampInZone(x: number, y: number, halfW = 0, halfH = 0): { x: number; y: number } {
  const midX = (SAFE_ZONE.left + SAFE_ZONE.right) / 2;
  const midY = (SAFE_ZONE.top + SAFE_ZONE.bottom) / 2;
  const innerW = SAFE_ZONE.right - SAFE_ZONE.left;
  const innerH = SAFE_ZONE.bottom - SAFE_ZONE.top;
  return {
    x: halfW * 2 >= innerW ? midX : Math.min(SAFE_ZONE.right - halfW, Math.max(SAFE_ZONE.left + halfW, x)),
    y: halfH * 2 >= innerH ? midY : Math.min(SAFE_ZONE.bottom - halfH, Math.max(SAFE_ZONE.top + halfH, y)),
  };
}

/** Widest a headline line can be: the safe zone, edge to edge. Words and the tile wrap at `HOOK_LINE_CLASS`. */
export const HOOK_LINE_W = SAFE_ZONE.right - SAFE_ZONE.left;
export const HOOK_LINE_MAX_PX = Math.round(HOOK_LINE_W * FRAME_W);

/** A centred box on the frame, as shares of width and height. */
export type Box = { x: number; y: number; halfW: number; halfH: number };
const CLEAR_GAP = 12 / FRAME_H;

/**
 * Words never sit on a logo. A text box that lands on one is pushed just clear of it — down if the
 * words are below that logo's middle, up if above — then kept inside the zone. Touching is fine.
 */
export function keepClear(point: { x: number; y: number }, halfW: number, halfH: number, boxes: Box[]): { x: number; y: number } {
  let at = clampInZone(point.x, point.y, halfW, halfH);
  for (let pass = 0; pass <= boxes.length; pass += 1) {
    const hit = boxes.find((box) => Math.abs(box.x - at.x) < box.halfW + halfW && Math.abs(box.y - at.y) < box.halfH + halfH);
    if (!hit) break;
    const y = at.y >= hit.y ? hit.y + hit.halfH + CLEAR_GAP + halfH : hit.y - hit.halfH - CLEAR_GAP - halfH;
    at = clampInZone(at.x, y, halfW, halfH);
  }
  return at;
}

export type LookMetrics = { fontsize: number; top: number; lineGap: number };
export type ListStack = { left: number; top: number; gap: number };

/** App text-tool sizes on 1080×1920. Both looks read as a hook, not a caption. */
export const LOOK_METRICS: Record<DrawnStyle, LookMetrics> = {
  tiktok: { fontsize: 82, top: 0.17, lineGap: 1.12 },
  instagram: { fontsize: 104, top: 0.14, lineGap: 1.16 },
  plain: { fontsize: 84, top: 0.12, lineGap: 1.12 },
};

export type BoxKind = true | "white";

export function isBoxed(box?: boolean | "white"): boolean {
  return box === true || box === "white";
}

export function boxIsWhite(box?: boolean | "white"): boolean {
  return box === "white";
}

export function lookPaint(style: DrawnStyle, box?: boolean | "white"): { borderStyle: 1 | 3; outline: number; shadow: number } {
  if (isBoxed(box) && style === "tiktok") return { borderStyle: 3, outline: 12, shadow: 0 };
  if (isBoxed(box) && style === "instagram") return { borderStyle: 3, outline: 8, shadow: 0 };
  if (isBoxed(box)) return { borderStyle: 3, outline: 10, shadow: 0 };
  if (style === "instagram") return { borderStyle: 1, outline: 4, shadow: 0 };
  if (style === "tiktok") return { borderStyle: 1, outline: 5, shadow: 0 };
  return { borderStyle: 1, outline: 6, shadow: 0 };
}

/** Preview plate at burn size (radius 14, pad 18×8 on 1080). TikTok is one card around every line. */
export function wordBoxClass(style: DrawnStyle, box?: boolean | "white"): string {
  if (!isBoxed(box)) return "";
  const fill = boxIsWhite(box) ? "bg-white text-black" : "bg-black text-white";
  return style === "instagram"
    ? `rounded-[0.741cqw] px-[1.296cqw] py-[0.370cqw] ${fill}`
    : `rounded-[1.296cqw] px-[1.667cqw] py-[0.741cqw] ${fill}`;
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
  const py = Math.round(FRAME_H * clampInZone(input.x ?? 0.5, input.y ?? look.top).y);
  const marginV = placed ? 0 : Math.round(FRAME_H * look.top);
  const lines = wrapHook(input.headline ?? "", input.style);
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
