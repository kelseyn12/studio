export const MAX_REFERENCES = 8;

export type ReferenceLink = { url: string; note: string };

/** https only. Anything else stays text so a bad link cannot become a click. */
export function httpsUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Saved list, or the old single link when the list is still empty. */
export function parseReferences(raw: string | null | undefined, fallbackUrl = ""): ReferenceLink[] {
  let parsed: unknown = [];
  try {
    parsed = JSON.parse(raw || "[]");
  } catch {
    parsed = [];
  }
  const links = Array.isArray(parsed)
    ? parsed.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const url = String((item as { url?: unknown }).url || "").trim();
        const note = String((item as { note?: unknown }).note || "").trim();
        if (!url && !note) return [];
        return [{ url, note }];
      })
    : [];
  if (links.length) return links.slice(0, MAX_REFERENCES);
  const fallback = fallbackUrl.trim();
  return fallback ? [{ url: fallback, note: "" }] : [];
}

export function packReferences(links: ReferenceLink[]): { referencesJson: string; referenceUrl: string } {
  const clean = links
    .map((link) => ({ url: link.url.trim(), note: link.note.trim() }))
    .filter((link) => link.url || link.note)
    .slice(0, MAX_REFERENCES);
  return {
    referencesJson: JSON.stringify(clean),
    referenceUrl: clean.find((link) => link.url)?.url || "",
  };
}

/** Form rows win. An older card with only referenceUrl still counts when the form did not send a list. */
export function referencesFromForm(
  urls: unknown,
  notes: unknown,
  savedJson: string,
  savedUrl: string,
): ReferenceLink[] {
  if (!Array.isArray(urls)) return parseReferences(savedJson, savedUrl);
  const noteList = Array.isArray(notes) ? notes : [];
  return parseReferences(
    packReferences(urls.map((url, index) => ({ url: String(url), note: String(noteList[index] || "") }))).referencesJson,
  );
}

/** One line per reference for the script writer. */
export function referenceLines(links: ReferenceLink[]): string {
  return links
    .filter((link) => link.url || link.note)
    .map((link) => [link.url, link.note].filter(Boolean).join(" — "))
    .join("\n");
}
