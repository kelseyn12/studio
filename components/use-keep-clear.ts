"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { keepClear, type Box } from "@/lib/list-layout";

/**
 * Where a headline block shows on the stage: the wanted spot, pushed clear of the logo row using the
 * block's rendered size as shares of the stage. Size only, so there is no feedback loop.
 */
export function useKeepClear(
  ref: RefObject<HTMLElement | null>,
  stageRef: RefObject<HTMLElement | null>,
  want: { x: number; y: number },
  boxes: Box[],
  /** Changes when the measured node is remounted, so it is observed again. */
  remountKey?: unknown,
): { x: number; y: number } {
  const [half, setHalf] = useState({ halfW: 0, halfH: 0 });
  useLayoutEffect(() => {
    const node = ref.current;
    const stage = stageRef.current;
    if (!node || !stage) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      const frame = stage.getBoundingClientRect();
      if (!frame.width || !frame.height) return;
      setHalf({ halfW: rect.width / frame.width / 2, halfH: rect.height / frame.height / 2 });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [ref, stageRef, remountKey]);
  return keepClear(want, half.halfW, half.halfH, boxes);
}
