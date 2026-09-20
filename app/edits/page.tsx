import Link from "next/link";
import { EditorNeed } from "@/components/editor-need";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { requireUser } from "@/lib/auth";
import { editorNeeds, packetReady } from "@/lib/editor-packet";
import { prisma } from "@/lib/prisma";

export default async function EditsPage() {
  const user = await requireUser();
  const cards = await prisma.card.findMany({
    where: {
      status: { in: ["FILMED", "EDITING", "REVIEW"] },
      ...(user.role === "EDITOR" ? { editorId: user.id } : {}),
    },
    include: { campaign: true, assets: true, editor: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">{user.role === "EDITOR" ? "Your cuts" : "CapCut in"}</h1>
      <p className="mt-2 mb-6 max-w-2xl text-mute">
        {user.role === "EDITOR"
          ? "Only cards assigned to you. Open the raws folder, export 1080×1920, drop the draft."
          : "Assign an editor on the card first. They will only see their own queue."}
      </p>
      <div className="space-y-3">
        {cards.length === 0 ? (
          <p className="rounded-card border border-dashed border-line px-5 py-10 text-mute">
            {user.role === "EDITOR" ? "Nothing assigned to you yet." : "Nothing waiting on a cut."}
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
                    {card.editor ? <p className="mt-1 text-sm text-mute">Editor: {card.editor.name}</p> : null}
                    {card.rawsUrl ? <p className="mt-1 text-sm text-sun">Raws folder is on the card</p> : null}
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
