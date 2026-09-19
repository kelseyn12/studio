import Link from "next/link";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { prisma } from "@/lib/prisma";

export default async function EditsPage() {
  const cards = await prisma.card.findMany({
    where: { status: { in: ["FILMED", "EDITING", "REVIEW"] } },
    include: { campaign: true, editor: true, assets: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Edit requests</h1>
      <p className="mt-1 mb-6 text-mute">Reference, script, raws, voice note, deadline. Then the editor returns the file.</p>
      <div className="space-y-3">
        {cards.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-5 py-10 text-mute">
            No edits in flight.
          </p>
        ) : (
          cards.map((card) => (
            <Link key={card.id} href={`/cards/${card.id}`} className="block rounded-2xl border border-line bg-panel p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{card.title}</h2>
                  <p className="text-sm text-mute">
                    {card.campaign?.name ?? "No deal"} · {card.editor?.name ?? "Unassigned"}
                  </p>
                </div>
                <StatusPill status={card.status} />
              </div>
              <p className="mt-3 text-sm text-mute">
                {card.assets.filter((asset) => asset.kind === "RAW").length} raws ·{" "}
                {card.assets.some((asset) => asset.kind === "VOICE") ? "voice note" : "no voice"} ·{" "}
                {card.assets.some((asset) => asset.kind === "EDITED") ? "delivery in" : "waiting"}
              </p>
            </Link>
          ))
        )}
      </div>
    </Shell>
  );
}
