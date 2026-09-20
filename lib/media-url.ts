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
