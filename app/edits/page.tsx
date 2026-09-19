import Link from "next/link";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
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
        You cut in CapCut. Studio only needs the export. Open a card, drop the file, schedule.
        No in-app editor — one less thing to babysit.
      </p>
      <div className="space-y-3">
        {cards.length === 0 ? (
          <p className="rounded-card border border-dashed border-line px-5 py-10 text-mute">
            Nothing waiting on a cut. Film a batch or generate variations first.
          </p>
        ) : (
          cards.map((card) => (
            <Link key={card.id} href={`/cards/${card.id}`} className="block rounded-card border border-line bg-panel p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{card.title}</h2>
                  <p className="text-sm text-mute">{card.campaign?.name ?? "No deal"}</p>
                </div>
                <StatusPill status={card.status} />
              </div>
              <p className="mt-3 text-sm text-mute">
                {card.assets.filter((asset) => asset.kind === "RAW").length} raws ·{" "}
                {card.assets.some((asset) => asset.kind === "VOICE") ? "voice note" : "no voice"} ·{" "}
                {card.assets.some((asset) => asset.kind === "EDITED" || asset.kind === "GENERATED")
                  ? "export in"
                  : "waiting on CapCut"}
              </p>
            </Link>
          ))
        )}
      </div>
    </Shell>
  );
}
