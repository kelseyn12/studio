import Link from "next/link";
import { EditorNeed } from "@/components/editor-need";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { editorNeeds, packetReady } from "@/lib/editor-packet";
import { prisma } from "@/lib/prisma";

export default async function EditsPage() {
  const cards = await prisma.card.findMany({
    where: { status: { in: ["FILMED", "EDITING", "REVIEW"] } },
    include: { campaign: true, assets: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">CapCut in</h1>
      <p className="mt-2 mb-6 max-w-2xl text-mute">
        You cut in CapCut. Studio only needs the export. Open a card, grab the packet, drop the file.
        Generated Repurpose videos skip this room — they already land Ready.
      </p>
      <div className="space-y-3">
        {cards.length === 0 ? (
          <p className="rounded-card border border-dashed border-line px-5 py-10 text-mute">
            Nothing waiting on a cut. Film a batch, or generate in Repurpose.
          </p>
        ) : (
          cards.map((card) => {
            const packet = editorNeeds(card);
            return (
              <Link key={card.id} href={`/cards/${card.id}`} className="block rounded-card border border-line bg-panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{card.title}</h2>
                    <p className="text-sm text-mute">{card.campaign?.name ?? "No deal"}</p>
                    {card.hook ? <p className="mt-2 text-sm">Hook: {card.hook}</p> : null}
                    {card.editorNote ? <p className="mt-1 text-sm text-mute">{card.editorNote}</p> : null}
                  </div>
                  <StatusPill status={card.status} />
                </div>
                <div className="mt-4">
                  <EditorNeed items={packet} />
                  <p className="mt-3 text-sm text-mute">
                    {packetReady(packet) ? "Packet is full. Cut it." : "Do not cut yet — packet is incomplete."}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </Shell>
  );
}
