export type FormatLane = "WINNER" | "CHALLENGER" | "TEST";

export function nextLanes(
  formats: Array<{ id: string; lane: FormatLane }>,
  winnerId: string,
): Array<{ id: string; lane: FormatLane }> {
  return formats.map((format) => ({
    id: format.id,
    lane: format.id === winnerId ? "WINNER" : format.lane === "WINNER" ? "CHALLENGER" : format.lane,
  }));
}
