import Link from "next/link";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { isPipelineStatus, PIPELINE_META, PIPELINE_STATUSES } from "@/lib/pipeline";
import { prisma } from "@/lib/prisma";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filter = params.status && isPipelineStatus(params.status) ? params.status : undefined;
  const cards = await prisma.card.findMany({
    where: filter ? { status: filter } : undefined,
    include: { campaign: true, format: true },
    orderBy: { updatedAt: "desc" },
  });
  const columns = filter ? [filter] : PIPELINE_STATUSES;

  return (
    <Shell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Pipeline</h1>
          <p className="mt-1 text-mute">Idea → script → film → edit → review → ready → posted → data.</p>
        </div>
        <Link href="/cards/new" className="rounded-xl bg-sun px-4 py-2 text-sm font-semibold text-ink">
          New card
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((status) => {
          const column = cards.filter((card) => card.status === status);
          return (
            <section key={status} className="w-72 shrink-0">
              <div className="mb-3 flex items-center justify-between">
                <StatusPill status={status} />
                <span className="text-xs text-mute">{PIPELINE_META[status].owner}</span>
              </div>
              <div className="space-y-2">
                {column.map((card) => (
                  <Link
                    key={card.id}
                    href={`/cards/${card.id}`}
                    className="block rounded-2xl border border-line bg-panel p-4"
                  >
                    <p className="font-medium">{card.title}</p>
                    <p className="mt-1 text-xs text-mute">
                      {card.campaign?.name ?? "No deal"}
                      {card.format ? ` · ${card.format.name}` : ""}
                    </p>
                  </Link>
                ))}
                {column.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-mute">
                    Empty
                  </p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </Shell>
  );
}
