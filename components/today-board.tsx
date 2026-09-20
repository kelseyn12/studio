import Link from "next/link";
import { DEAL_KIND_LABEL } from "@/lib/deal-kind";
import { formatMoney } from "@/lib/deals";
import type { Campaign } from "@prisma/client";

export function TodayBoard({
  collected,
  pending,
  capcut,
  review,
  ready,
  tech,
  ugc,
}: {
  collected: number;
  pending: number;
  capcut: number;
  review: number;
  ready: number;
  tech: Campaign[];
  ugc: Campaign[];
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-4">
        <Link href="/analytics" className="rounded-card border border-line bg-panel px-4 py-3">
          <p className="text-xs uppercase text-mute">Collected</p>
          <p className="mt-1 text-2xl font-semibold">{formatMoney(collected)}</p>
        </Link>
        <Link href="/campaigns" className="rounded-card border border-line bg-panel px-4 py-3">
          <p className="text-xs uppercase text-mute">Pending pay</p>
          <p className="mt-1 text-2xl font-semibold">{formatMoney(pending)}</p>
        </Link>
        <Link href="/edits" className="rounded-card border border-line bg-panel px-4 py-3">
          <p className="text-xs uppercase text-mute">CapCut in</p>
          <p className="mt-1 text-2xl font-semibold">{capcut + review}</p>
          <p className="text-xs text-mute">{review} to review</p>
        </Link>
        <Link href="/calendar" className="rounded-card border border-line bg-panel px-4 py-3">
          <p className="text-xs uppercase text-mute">Ready to park</p>
          <p className="mt-1 text-2xl font-semibold">{ready}</p>
        </Link>
      </section>
      <section className="grid gap-3 md:grid-cols-2">
        <DealLane title="Canvas / tech" href="/campaigns?kind=TECH" deals={tech} />
        <DealLane title="Traditional UGC" href="/campaigns?kind=UGC" deals={ugc} />
      </section>
    </div>
  );
}

function DealLane({ title, href, deals }: { title: string; href: string; deals: Campaign[] }) {
  return (
    <div className="rounded-card border border-line bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mute">{title}</p>
        <Link href={href} className="text-sm text-sun">
          All
        </Link>
      </div>
      {deals.length === 0 ? (
        <p className="text-sm text-mute">None yet. Add one on Deals.</p>
      ) : (
        <ul className="space-y-2">
          {deals.slice(0, 4).map((deal) => (
            <li key={deal.id}>
              <Link href={`/campaigns/${deal.id}`} className="block rounded-xl bg-lift px-3 py-2">
                <p className="font-medium">{deal.brand || deal.name}</p>
                <p className="text-xs text-mute">
                  {DEAL_KIND_LABEL[deal.kind]} · {formatMoney(deal.basePayCents)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
