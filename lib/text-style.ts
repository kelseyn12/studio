/**
 * Which app look hook text takes so it reads like the platform's own text tool.
 * The drawing itself lives in lib/ass.ts (libass); positions there stay inside each
 * app's safe zone (clear of the header at the top, the caption block at the bottom and the icon
 * column on the right). "auto" follows the account the batch posts to.
 */
export const TEXT_STYLES = ["auto", "tiktok", "instagram", "plain"] as const;
export type TextStyle = (typeof TEXT_STYLES)[number];
export type DrawnStyle = Exclude<TextStyle, "auto">;

export const TEXT_STYLE_LABEL: Record<TextStyle, string> = {
  auto: "Match the account",
  tiktok: "TikTok text",
  instagram: "Instagram text",
  plain: "Plain bold",
};

export const HOOK_MAX_CHARS = 80;
const WRAP_AT = 26;

export function parseTextStyle(value: unknown): TextStyle {
  return TEXT_STYLES.includes(value as TextStyle) ? (value as TextStyle) : "auto";
}

/**
 * Which app look to use for an account. Meta apps share Instagram's text tool; TikTok, YouTube
 * Shorts and everything else read best with the TikTok look. Plain only when there is no account.
 */
export function textStyleForNetwork(network: string | null | undefined): DrawnStyle {
  const key = (network || "").toLowerCase();
  if (!key) return "plain";
  if (key.includes("instagram") || key.includes("facebook") || key.includes("threads")) return "instagram";
  return "tiktok";
}

/** Distinct looks a set of accounts needs, in a stable order. Two looks means two files per video. */
export function looksForNetworks(networks: string[]): DrawnStyle[] {
  const order: DrawnStyle[] = ["instagram", "tiktok", "plain"];
  const wanted = new Set(networks.map(textStyleForNetwork));
  return order.filter((look) => wanted.has(look));
}

/**
 * One look for a set of accounts. All TikTok → TikTok; all Meta → Instagram; a mix (cross-posting)
 * → TikTok, which reads as native on TikTok and natural everywhere else.
 */
export function textStyleForNetworks(networks: string[]): DrawnStyle {
  const looks = looksForNetworks(networks);
  if (looks.length === 1) return looks[0];
  if (looks.length === 0) return "plain";
  return "tiktok";
}

export function resolveTextStyle(style: TextStyle, networks: string | string[] | null | undefined): DrawnStyle {
  if (style !== "auto") return style;
  return Array.isArray(networks) ? textStyleForNetworks(networks) : textStyleForNetwork(networks);
}

/** Breaks a hook into lines the way the apps wrap: word boundaries, about 26 characters. */
export function wrapHook(text: string): string[] {
  const words = text.trim().slice(0, HOOK_MAX_CHARS).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > WRAP_AT && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Which looks to render for one Multiply output. With text on the video and "auto" on a deal that
 * spans looks, every look gets its own file. Without text the look does not matter, so one file.
 */
export function hookLooks(style: string, networks: string[], hasText: boolean): DrawnStyle[] {
  const parsed = parseTextStyle(style);
  if (!hasText) return [resolveTextStyle(parsed, networks)];
  if (parsed !== "auto") return [parsed];
  const looks = looksForNetworks(networks);
  return looks.length > 0 ? looks : ["plain"];
}
