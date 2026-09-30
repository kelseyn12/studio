/** A watch, shorts, or youtu.be link, or a bare 11-character id. */
export function youtubeVideoId(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  if (/^[\w-]{11}$/.test(text)) return text;
  try {
    const url = new URL(text);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] || "";
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const watch = url.searchParams.get("v") || "";
      if (/^[\w-]{11}$/.test(watch)) return watch;
      const shorts = url.pathname.match(/\/shorts\/([\w-]{11})/);
      if (shorts) return shorts[1];
    }
  } catch {
    return null;
  }
  return null;
}

export function viewCountFromWatchHtml(html: string): number | null {
  const match = html.match(/"viewCount":"(\d+)"/);
  if (!match) return null;
  const count = Number(match[1]);
  return Number.isFinite(count) ? count : null;
}

/** Public view count for a video posted in YouTube Studio. No Outstand post, no API key. */
export async function youtubePublicViews(raw: string): Promise<number | null> {
  const id = youtubeVideoId(raw);
  if (!id) return null;
  const response = await fetch(`https://www.youtube.com/watch?v=${id}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  return viewCountFromWatchHtml(await response.text());
}
