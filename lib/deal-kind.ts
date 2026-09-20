import type { DealKind } from "@prisma/client";

export const DEAL_KIND_LABEL: Record<DealKind, string> = {
  TECH: "Canvas / tech",
  UGC: "Traditional UGC",
};

export function isDealKind(value: string): value is DealKind {
  return value === "TECH" || value === "UGC";
}
