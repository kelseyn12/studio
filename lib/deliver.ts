/** A finished video can leave To schedule when she sends it to the brand herself. */
export function canMarkDelivered(
  status: string,
  scheduledAt: Date | string | null,
  hasFile: boolean,
): boolean {
  return status === "READY" && !scheduledAt && hasFile;
}

/** Posted with no app jobs means the brand got the file. A social post keeps saying Posted. */
export function deliveredLabel(status: string, publishCount: number): string | null {
  if (status !== "POSTED" || publishCount > 0) return null;
  return "Sent to the brand";
}
