/** A CapCut Teams (or project) link the editor can open. Anything else is ignored. */
export function capcutHref(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "capcut.com" && !host.endsWith(".capcut.com")) return null;
    return url.toString();
  } catch {
    return null;
  }
}
