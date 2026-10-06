/** A finished-file URL. A Drive folder is rejected. A Drive file link becomes the download URL. */
export function directMediaUrl(value: string): string | null {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    const host = parsed.hostname;
    if (host === "drive.google.com" || host === "docs.google.com") {
      if (parsed.pathname.includes("/folders/")) return null;
      const fromPath = parsed.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
      const id = fromPath || parsed.searchParams.get("id");
      if (!id) return null;
      return `https://drive.google.com/uc?export=download&id=${id}`;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isDirectMediaUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const host = parsed.hostname;
    if (host.endsWith("drive.google.com") && !parsed.pathname.includes("/uc")) return false;
    return true;
  } catch {
    return false;
  }
}
