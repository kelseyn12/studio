import Link from "next/link";
import { Shell } from "@/components/shell";
import { DEAL_KIND_LABEL, isDealKind } from "@/lib/deal-kind";
import { formatMoney, scoreDeal } from "@/lib/deals";
import { studioSnapshot } from "@/lib/queries";
import { prisma } from "@/lib/prisma";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const params = await searchParams;
  const rawKind = params.kind || "";
  const kind = isDealKind(rawKind) ? rawKind : undefined;
  const [campaigns, snap] = await Promise.all([
    prisma.campaign.findMany({
      where: kind ? { kind } : undefined,
      orderBy: { createdAt: "desc" },
    }),
    studioSnapshot(),
  ]);

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Deals</h1>
          <p className="mt-1 text-mute">Canvas / tech and traditional UGC live here with the money. Not a second app.</p>
        </div>
        <Link href="/campaigns/new" className="rounded-xl bg-sun px-4 py-2 text-sm font-semibold text-ink">
          Add a deal
        </Link>
      </div>
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-card border border-line bg-panel px-4 py-3">
          <p className="text-xs uppercase text-mute">Collected</p>
          <p className="mt-1 text-2xl font-semibold">{formatMoney(snap.collected)}</p>
        </div>
        <div className="rounded-card border border-line bg-panel px-4 py-3">
          <p className="text-xs uppercase text-mute">Pending pay</p>
          <p className="mt-1 text-2xl font-semibold">{formatMoney(snap.pending)}</p>
        </div>
        <div className="rounded-card border border-line bg-panel px-4 py-3">
          <p className="text-xs uppercase text-mute">Active deals</p>
          <p className="mt-1 text-2xl font-semibold">{snap.tech.length + snap.ugc.length}</p>
        </div>
      </div>
      <div className="mb-6 flex gap-2">
        {[
          { href: "/campaigns", label: "All" },
          { href: "/campaigns?kind=TECH", label: "Canvas / tech" },
          { href: "/campaigns?kind=UGC", label: "Traditional UGC" },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-xl px-3 py-2 text-sm ${
              (tab.href === "/campaigns" && !kind) || tab.href.endsWith(kind || "no")
                ? "bg-sun font-semibold text-ink"
                : "border border-line text-mute"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-5 py-10 text-mute">
            Add a canvas/tech deal or a traditional UGC deal. Cards you attach will show here and on Today.
          </p>
        ) : (
          campaigns.map((campaign) => {
            const score = scoreDeal(campaign);
            return (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="block rounded-2xl border border-line bg-panel p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-mute">
                      {DEAL_KIND_LABEL[campaign.kind]} · {campaign.status}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">{campaign.name}</h2>
                    <p className="text-sm text-mute">{campaign.brand}</p>
                  </div>
                  <p className="text-3xl font-semibold">{score.total}</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <p>{formatMoney(campaign.basePayCents)}</p>
                  <p>{campaign.kind === "UGC" ? `${campaign.videoCount} videos` : `${campaign.postsPerDay}x/day`}</p>
                  <p>{formatMoney(score.hourlyCents)} / hr</p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </Shell>
  );
}
