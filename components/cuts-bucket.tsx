import Link from "next/link";
import { DeleteVideoButton } from "@/components/delete-video";
import { EditorNeed } from "@/components/editor-need";
import { StatusPill } from "@/components/status-pill";
import { DEAL_KIND_LABEL } from "@/lib/deal-kind";
import { editorNeeds, packetReady } from "@/lib/editor-packet";

export type CutsCard = {
  id: string;
  title: string;
  hook: string;
  body: string;
  script: string;
  editorNote: string;
  rawsUrl: string;
  status: Parameters<typeof StatusPill>[0]["status"];
  cutBy: "SELF" | "EDITOR";
  scheduledAt: Date | null;
  campaign: { name: string; brand: string; kind: "TECH" | "UGC" } | null;
  editor: { name: string } | null;
  assets: Array<{ kind: string }>;
};

/** One list on Cuts for videos that did not come from a Multiply batch. */
export function CutsBucket({
  title,
  items,
  empty,
  canDelete = false,
}: {
  title: string;
  canDelete?: boolean;
  items: CutsCard[];
  empty: string;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold">
        {title} · {items.length}
      </h2>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-card border border-dashed border-line px-5 py-6 text-sm text-mute">{empty}</p>
        ) : (
          items.map((card) => {
            const packet = editorNeeds(card);
            const dropFile = card.cutBy === "SELF" && card.status === "FILMED";
            const schedule = card.status === "REVIEW";
            const href = `/cards/${card.id}?step=${schedule ? "live" : "editor"}`;
            return (
              <article key={card.id} className="rounded-card border border-line bg-panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link href={href} className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold">{card.title}</h3>
                    <p className="text-sm text-mute">
                      {card.campaign
                        ? `${DEAL_KIND_LABEL[card.campaign.kind]} · ${card.campaign.brand || card.campaign.name}`
                        : "Personal"}
                      {card.editor ? ` · ${card.editor.name}` : ""}
                    </p>
                  </Link>
                  <div className="flex flex-col items-end gap-2">
                    <StatusPill status={card.status} scheduledAt={card.scheduledAt} />
                    {canDelete ? <DeleteVideoButton id={card.id} back="/edits" label="Delete" /> : null}
                  </div>
                </div>
                <Link href={href} className="mt-4 block">
                  {dropFile || schedule ? null : <EditorNeed items={packet} />}
                  <p className="mt-3 text-sm text-mute">
                    {dropFile
                      ? "Drop one file. Pick IG · FB or TT · YT."
                      : schedule
                        ? "Set the thumbnail, accounts, caption, and time."
                        : packetReady(packet)
                          ? "Files are ready. Cut it."
                          : "Still missing files."}
                  </p>
                </Link>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
