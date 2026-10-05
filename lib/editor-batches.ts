import { dealAccounts } from "@/lib/targets";
import { LOOK_TAG, looksForNetworks, type DrawnStyle } from "@/lib/text-style";
import { groupWaitingFolders } from "@/lib/waiting-folders";

export type WordsLine = { label: string; words: string };

export type EditorStage = "send" | "cutting" | "review";

export type EditorBatchCard = {
  id: string;
  title: string;
  hook: string;
  body: string;
  plug: string;
  status: string;
  campaignId: string | null;
  campaign: { name: string } | null;
  assets: Array<{ kind: string; textStyle: string | null; path: string; filename: string }>;
};

export type EditorBatchRowData = {
  id: string;
  mixLabel: string;
  words: WordsLine[];
  needs: NeededLook[];
  cleanFiles: Array<{ path: string; filename: string }>;
  stage: EditorStage;
};

export type EditorBatchFolder = { key: string; name: string; rows: EditorBatchRowData[] };

export function editorStage(status: string): EditorStage {
  if (status === "REVIEW") return "review";
  if (status === "EDITING") return "cutting";
  return "send";
}

/**
 * Cuts page folders: one per Multiply batch, every mix inside with its words, the files it
 * still needs, and the clean videos to download. Videos not from a batch are returned loose.
 */
export function groupEditorBatches<T extends EditorBatchCard>(
  cards: T[],
  accounts: Array<{ network: string; isActive: boolean; campaignId: string | null }>,
  batchByCard: Map<string, string>,
): { folders: EditorBatchFolder[]; loose: T[] } {
  const inBatch = cards.filter((card) => batchByCard.has(card.id));
  const loose = cards.filter((card) => !batchByCard.has(card.id));
  const grouped = groupWaitingFolders(
    inBatch.map((card) => ({ ...card, batch: batchByCard.get(card.id) ?? "", deal: card.campaign?.name ?? "" })),
  );
  const folders = grouped.map((group) => ({
    key: group.key,
    name: group.title,
    rows: group.cards.map((card) => {
      const networks = dealAccounts(accounts, card.campaignId).map((account) => account.network);
      const dropped = card.assets.filter((asset) => asset.kind === "EDITED").map((asset) => asset.textStyle ?? "");
      return {
        id: card.id,
        mixLabel: card.mixLabel,
        words: wordsSheet(card),
        needs: neededLooks(networks, dropped),
        cleanFiles: card.assets
          .filter((asset) => asset.kind === "GENERATED")
          .map((asset) => ({ path: asset.path, filename: asset.filename })),
        stage: editorStage(card.status),
      };
    }),
  }));
  return { folders, loose };
}

/** The words the editor puts on this video, in the order they appear. Empty slots are left out. */
export function wordsSheet(card: { hook: string; body: string; plug: string }): WordsLine[] {
  return [
    { label: "Hook", words: card.hook.trim() },
    { label: "Body", words: card.body.trim() },
    { label: "CTA", words: card.plug.trim() },
  ].filter((line) => line.words.length > 0);
}

export type NeededLook = { look: DrawnStyle; tag: string; done: boolean };

/**
 * Which finished files this video needs. A deal on Instagram and TikTok needs two: IG · FB and
 * TT · YT. One app family, or no accounts, needs one file for every app.
 */
export function neededLooks(networks: string[], dropped: string[]): NeededLook[] {
  const looks = looksForNetworks(networks);
  const show: DrawnStyle[] = looks.length > 1 ? looks : ["plain"];
  const have = new Set(dropped);
  return show.map((look) => ({
    look,
    tag: LOOK_TAG[look] || "Every app",
    done: have.has(look) || (look !== "plain" && have.has("plain")) || (look === "plain" && have.size > 0),
  }));
}

/** The mix number in a title or a file name: "mix 2", "mix-2", "Mix_2", "mix2". */
export function mixNumberIn(text: string): number | null {
  const match = text.match(/mix[\s_-]*(\d+)/i);
  return match ? Number(match[1]) : null;
}

/** IG or FB in the name means the IG · FB file, TT or YT the TT · YT file, nothing means every app. */
export function lookInFileName(filename: string): DrawnStyle {
  const base = filename.replace(/\.[a-z0-9]+$/i, "");
  if (/(^|[\s_\-·.])(ig|fb|insta|instagram|facebook)([\s_\-·.]|$)/i.test(base)) return "instagram";
  if (/(^|[\s_\-·.])(tt|yt|tiktok|youtube|shorts)([\s_\-·.]|$)/i.test(base)) return "tiktok";
  return "plain";
}

/**
 * Pairs a dropped file with the video it belongs to by mix number. Returns null when the name has
 * no mix number or no video in the batch has that number.
 */
export function matchDropToCard<T extends { id: string; title: string }>(
  filename: string,
  cards: T[],
): { card: T; textStyle: DrawnStyle } | null {
  const number = mixNumberIn(filename);
  if (number === null) return null;
  const card = cards.find((row) => mixNumberIn(row.title) === number);
  if (!card) return null;
  return { card, textStyle: lookInFileName(filename) };
}
