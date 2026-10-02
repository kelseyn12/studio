import Link from "next/link";
import { EditorNeed } from "@/components/editor-need";
import { LiveRefresh } from "@/components/live-refresh";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { requireUser } from "@/lib/auth";
import { DEAL_KIND_LABEL } from "@/lib/deal-kind";
import { editorNeeds, packetReady } from "@/lib/editor-packet";
import { prisma } from "@/lib/prisma";

export default async function EditsPage() {
  const user = await requireUser();
  const mine = user.role === "EDITOR" ? { editorId: user.id } : {};
  const cards = await prisma.card.findMany({
    where: { status: { in: ["FILMED", "EDITING", "REVIEW"] }, ...mine },
    include: { campaign: true, assets: true, editor: true },
    orderBy: { updatedAt: "desc" },
  });
  const selfCut = user.role === "EDITOR" ? [] : cards.filter((card) => card.status === "FILMED" && card.cutBy === "SELF");
  const send = cards.filter((card) => card.status === "FILMED" && card.cutBy === "EDITOR");
  const cutting = cards.filter((card) => card.status === "EDITING");
  const review = cards.filter((card) => card.status === "REVIEW");

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">{user.role === "EDITOR" ? "Your cuts" : "Cuts"}</h1>
      <p className="mt-2 mb-2 max-w-2xl text-mute">
        {user.role === "EDITOR"
          ? "Jobs show up here when she sends them. Watch here. Drop the finished video here when you are done — it goes to To approve for her."
          : "Drop the finished video on each one. Then open it and set the cover, accounts, caption, and time. Send is only when someone else is cutting."}
      </p>
      <div className="mb-6">
        <LiveRefresh />
      </div>
      {user.role === "EDITOR" ? null : <Bucket title="Drop the file" items={selfCut} empty="Nothing waiting for a finished file." />}
      <Bucket title={user.role === "EDITOR" ? "To cut" : "Send"} items={send} empty="Nothing waiting to send." />
      <Bucket title="With the editor" items={cutting} empty="Nothing with the editor." />
      <Bucket title="To approve" items={review} empty="Nothing waiting for you." />
    </Shell>
  );
}

function Bucket({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{
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
  }>;
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
            return (
              <Link
                key={card.id}
                href={`/cards/${card.id}?step=${schedule ? "live" : "editor"}`}
                className="block rounded-card border border-line bg-panel p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{card.title}</h3>
                    <p className="text-sm text-mute">
                      {card.campaign
                        ? `${DEAL_KIND_LABEL[card.campaign.kind]} · ${card.campaign.brand || card.campaign.name}`
                        : "Personal"}
                      {card.editor ? ` · ${card.editor.name}` : ""}
                    </p>
                  </div>
                  <StatusPill status={card.status} scheduledAt={card.scheduledAt} />
                </div>
                <div className="mt-4">
                  {dropFile || schedule ? null : <EditorNeed items={packet} />}
                  <p className="mt-3 text-sm text-mute">
                    {dropFile
                      ? "Drop the finished video."
                      : schedule
                        ? "Set the cover, accounts, caption, and time."
                        : packetReady(packet)
                          ? "Files are ready. Cut it."
                          : "Still missing files."}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
