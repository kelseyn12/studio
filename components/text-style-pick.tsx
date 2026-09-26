"use client";

import { TEXT_STYLE_LABEL, TEXT_STYLES, textStyleForNetworks, type TextStyle } from "@/lib/text-style";

const LOOK_NOTE: Record<Exclude<TextStyle, "auto">, string> = {
  tiktok: "chunky white with a soft shadow, like TikTok's text tool",
  instagram: "each line on a dark box, like Instagram's Modern text",
  plain: "bold white with a black outline",
};

/** Picks how burned-in hook text is styled. "Match the account" follows the deal's accounts (or the one picked) below. */
export function TextStylePick({
  value,
  onChange,
  networks,
}: {
  value: TextStyle;
  onChange: (next: TextStyle) => void;
  networks: string[];
}) {
  const drawn = value === "auto" ? textStyleForNetworks(networks) : value;
  const mixed = value === "auto" && new Set(networks.map((network) => network.toLowerCase())).size > 1;
  const note =
    value === "auto" && networks.length === 0
      ? "Pick a deal or account below and the text takes that app's look."
      : `Looks like: ${LOOK_NOTE[drawn]}.${mixed ? " Cross-posting, so one look that reads native everywhere." : ""}`;
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm">Text look</span>
        <select
          name="textStyle"
          value={value}
          onChange={(event) => onChange(event.target.value as TextStyle)}
          className="field max-w-xs"
        >
          {TEXT_STYLES.map((style) => (
            <option key={style} value={style}>
              {TEXT_STYLE_LABEL[style]}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 text-xs text-mute">{note}</p>
    </div>
  );
}
