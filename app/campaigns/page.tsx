import Link from "next/link";
import { Shell } from "@/components/shell";
import { formatMoney, scoreDeal } from "@/lib/deals";
import { prisma } from "@/lib/prisma";

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <Shell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Deals</h1>
          <p className="mt-1 text-mute">Score the iceberg, not just the base rate. Max a deep deal before adding another.</p>
        </div>
        <Link href="/campaigns/new" className="rounded-xl bg-sun px-4 py-2 text-sm font-semibold text-ink">
          Score a deal
        </Link>
      </div>
      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-5 py-10 text-mute">
            No campaigns yet. Add one and score volume, hourly rate, and approval friction.
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
                    <p className="text-xs uppercase tracking-[0.16em] text-mute">{campaign.status}</p>
                    <h2 className="mt-1 text-xl font-semibold">{campaign.name}</h2>
                    <p className="text-sm text-mute">{campaign.brand}</p>
                  </div>
                  <p className="text-3xl font-semibold">{score.total}</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <p>
                    {formatMoney(campaign.basePayCents)} · {campaign.postsPerDay}x/day
                  </p>
                  <p>{formatMoney(score.monthlyPayoutCents)} / mo</p>
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
