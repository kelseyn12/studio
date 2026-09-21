export type PacketItem = { label: string; ok: boolean };

export function editorNeeds(card: {
  hook: string;
  body: string;
  script: string;
  editorNote: string;
  rawsUrl?: string;
  assets: Array<{ kind: string }>;
}): PacketItem[] {
  const raws = card.assets.filter((asset) => asset.kind === "RAW").length;
  const folder = Boolean(card.rawsUrl?.trim());
  return [
    { label: "Hook written", ok: card.hook.trim().length > 0 },
    { label: "Body or script written", ok: card.body.trim().length > 0 || card.script.trim().length > 0 },
    {
      label: folder ? "Drive folder linked" : raws ? `${raws} clip${raws === 1 ? "" : "s"}` : "Drive folder or clips",
      ok: folder || raws > 0,
    },
    {
      label: "Voice note or written note",
      ok: card.assets.some((asset) => asset.kind === "VOICE") || card.editorNote.trim().length > 0,
    },
  ];
}

export function packetReady(items: PacketItem[]): boolean {
  return items.every((item) => item.ok);
}
