/** One title per new video. How many only decides how many name boxes to show. */

export const NEW_VIDEO_LIMIT = 40;

export function titlesForCount(current: string[], count: number): string[] {
  const size = Math.min(NEW_VIDEO_LIMIT, Math.max(1, Math.floor(count) || 1));
  return Array.from({ length: size }, (_, index) => current[index] ?? "");
}

export function videoTitles(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean).slice(0, NEW_VIDEO_LIMIT);
}
