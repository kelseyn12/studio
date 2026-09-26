/**
 * How burned-in hook text is drawn so it reads like the platform's own text tool.
 * "auto" follows the account the batch posts to. Everything stays inside each
 * app's safe zone (clear of the header at the top, the caption block at the bottom
 * and the icon column on the right).
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

/** Which app look to use for an account. Meta apps share Instagram's text tool. */
export function textStyleForNetwork(network: string | null | undefined): DrawnStyle {
  const key = (network || "").toLowerCase();
  if (key.includes("tiktok")) return "tiktok";
  if (key.includes("instagram") || key.includes("facebook") || key.includes("threads")) return "instagram";
  return "plain";
}

/**
 * One look for a set of accounts. All TikTok → TikTok; all Meta → Instagram; a mix (cross-posting)
 * → TikTok, which reads as native on TikTok and natural everywhere else.
 */
export function textStyleForNetworks(networks: string[]): DrawnStyle {
  const looks = new Set(networks.map(textStyleForNetwork));
  if (looks.size === 1) return [...looks][0];
  if (looks.size === 0) return "plain";
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

type StyleSpec = { fontsize: number; lineGap: number; top: number; look: string[] };

/** Positions: TikTok's header covers the top ~9%, Instagram Reels ~12%; both are clear below 15%. */
const STYLE_SPECS: Record<DrawnStyle, StyleSpec> = {
  // TikTok classic: chunky white text, thin outline plus a soft drop shadow.
  tiktok: {
    fontsize: 60,
    lineGap: 12,
    top: 0.18,
    look: ["borderw=2", "bordercolor=black@0.85", "shadowcolor=black@0.55", "shadowx=3", "shadowy=3"],
  },
  // Instagram "Modern": each line sits on its own solid box.
  instagram: { fontsize: 54, lineGap: 20, top: 0.16, look: ["box=1", "boxcolor=black@0.62", "boxborderw=18"] },
  plain: { fontsize: 56, lineGap: 10, top: 0.12, look: ["borderw=4", "bordercolor=black"] },
};

/**
 * One centered drawtext per wrapped line. Drawing lines separately keeps every line
 * centered on any ffmpeg version and gives Instagram its per-line box.
 * `escapedLines` must already be drawtext-escaped.
 */
export function hookTextFilters(input: {
  escapedLines: string[];
  style: DrawnStyle;
  color: string;
  fontfile: string;
}): string[] {
  const spec = STYLE_SPECS[input.style];
  const lineHeight = spec.fontsize + spec.lineGap;
  return input.escapedLines.map((line, index) =>
    [
      `drawtext=fontfile=${input.fontfile}`,
      `text='${line}'`,
      `fontsize=${spec.fontsize}`,
      `fontcolor=${input.color}`,
      ...spec.look,
      "x=(w-text_w)/2",
      `y=h*${spec.top}+${index * lineHeight}`,
    ].join(":"),
  );
}
