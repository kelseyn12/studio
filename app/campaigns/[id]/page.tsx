import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DealEdit } from "@/components/deal-edit";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { DEAL_KIND_LABEL } from "@/lib/deal-kind";
import { formatMoney, scoreDeal } from "@/lib/deals";
import { prisma } from "@/lib/prisma";

async function addFormat(formData: FormData) {
  "use server";
  const campaignId = String(formData.get("campaignId"));
  await prisma.format.create({
    data: {
      campaignId,
      name: String(formData.get("name") || "Untitled format"),
      lane: (formData.get("lane") as "WINNER" | "CHALLENGER" | "TEST") || "TEST",
    },
  });
  redirect(`/campaigns/${campaignId}`);
}

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [campaign, delivered] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id },
      include: { formats: true, cards: { orderBy: { updatedAt: "desc" }, take: 20 } },
    }),
    prisma.card.count({
      where: { campaignId: id, OR: [{ status: { in: ["POSTED", "DATA"] } }, { postedAt: { not: null } }] },
    }),
  ]);
  if (!campaign) notFound();
  const score = scoreDeal(campaign);
  const promised = Math.max(campaign.videoCount, 1);
  const deliveredPct = Math.min(100, Math.round((delivered / promised) * 100));

  return (
    <Shell>
      <div className="mb-8">
        <p className="text-sm text-mute">
          {DEAL_KIND_LABEL[campaign.kind]} · {campaign.brand}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{campaign.name}</h1>
        {campaign.deliverables ? <p className="mt-2 text-sm text-mute">{campaign.deliverables}</p> : null}
      </div>
      <section className="mb-8 grid gap-3 md:grid-cols-5">
        <div className="rounded-2xl bg-sun px-5 py-4 text-ink">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]">Score</p>
          <p className="mt-2 text-4xl font-semibold">{score.total}</p>
          <p className="mt-1 text-sm text-ink/70">{score.verdict}</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel px-5 py-4">
          <p className="text-xs text-mute">Monthly if you max it</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(score.monthlyPayoutCents)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel px-5 py-4">
          <p className="text-xs text-mute">Creator hourly</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(score.hourlyCents)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel px-5 py-4">
          <p className="text-xs text-mute">Daily slots</p>
          <p className="mt-2 text-2xl font-semibold">{campaign.postsPerDay * campaign.accountsAllowed}</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel px-5 py-4">
          <p className="text-xs text-mute">Delivered</p>
          <p className="mt-2 text-2xl font-semibold">
            {delivered} / {promised}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-lift">
            <div className="h-full rounded-full bg-sun" style={{ width: `${deliveredPct}%` }} />
          </div>
        </div>
      </section>
      <DealEdit deal={campaign} />
      {score.reasons.length > 0 ? (
        <ul className="mb-8 space-y-2 text-sm text-mute">
          {score.reasons.map((reason) => (
            <li key={reason}>— {reason}</li>
          ))}
        </ul>
      ) : (
        <p className="mb-8 text-sm text-live">This deal can carry volume. Max it before adding another.</p>
      )}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Formats · 70 / 20 / 10</h2>
        <form action={addFormat} className="mb-4 flex flex-wrap gap-2">
          <input type="hidden" name="campaignId" value={campaign.id} />
          <input name="name" placeholder="Format name" className="rounded-xl border border-line bg-lift px-3 py-2" />
          <select name="lane" className="rounded-xl border border-line bg-lift px-3 py-2">
            <option value="WINNER">Winner</option>
            <option value="CHALLENGER">Challenger</option>
            <option value="TEST">Test</option>
          </select>
          <button className="rounded-xl bg-sun px-3 py-2 text-sm font-semibold text-ink">Add format</button>
        </form>
        <div className="grid gap-2 md:grid-cols-3">
          {campaign.formats.map((format) => (
            <div key={format.id} className="rounded-2xl border border-line bg-panel px-4 py-3">
              <p className="text-xs uppercase text-mute">{format.lane}</p>
              <p className="font-medium">{format.name}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Videos</h2>
        <div className="space-y-2">
          {campaign.cards.map((card) => (
            <Link key={card.id} href={`/cards/${card.id}`} className="flex items-center justify-between rounded-2xl border border-line bg-panel px-4 py-3">
              <span>{card.title}</span>
              <StatusPill status={card.status} />
            </Link>
          ))}
        </div>
      </section>
    </Shell>
  );
}
