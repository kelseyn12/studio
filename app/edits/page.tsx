import Link from "next/link";
import { DeleteVideoButton } from "@/components/delete-video";
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
          : "Each name is its own video. Drop one file and pick IG · FB or TT · YT. Then set the cover, accounts, caption, and time. The other version is the other name."}
      </p>
      <div className="mb-6">
        <LiveRefresh />
      </div>
      {user.role === "EDITOR" ? null : (
        <Bucket title="Drop the file" items={selfCut} empty="Nothing waiting for a finished file." canDelete />
      )}
      <Bucket title={user.role === "EDITOR" ? "To cut" : "Send"} items={send} empty="Nothing waiting to send." canDelete={user.role !== "EDITOR"} />
      <Bucket title="With the editor" items={cutting} empty="Nothing with the editor." canDelete={user.role !== "EDITOR"} />
      <Bucket title="To approve" items={review} empty="Nothing waiting for you." canDelete={user.role !== "EDITOR"} />
    </Shell>
  );
}

function Bucket({
  title,
  items,
  empty,
  canDelete = false,
}: {
  title: string;
  canDelete?: boolean;
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
                        ? "Set the cover, accounts, caption, and time."
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
