import { Shell } from "@/components/shell";
import { hasOutstand, MANAGED_NETWORKS } from "@/lib/outstand";
import { prisma } from "@/lib/prisma";
import { saveAccount } from "./actions";

export default async function ConnectionsPage() {
  const [accounts, campaigns] = await Promise.all([
    prisma.socialAccount.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.campaign.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const canConnect = hasOutstand() && Boolean(process.env.OUTSTAND_ORG_ID);

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Accounts</h1>
      <p className="mt-1 mb-6 max-w-2xl text-mute">
        Link TikTok, Instagram, YouTube, and X in Outstand. Then Sync so Studio can post as those accounts. Put each
        account on its deal — a deal video posts to every account on that deal at once.
      </p>
      <div className="mb-6 flex flex-wrap gap-2">
        <a
          href="https://www.outstand.so/app"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-sun px-4 py-2 text-sm font-semibold text-ink"
        >
          Open Outstand
        </a>
        {canConnect
          ? MANAGED_NETWORKS.map((network) => (
              <a
                key={network}
                href={`/api/outstand/connect?network=${network}`}
                className="rounded-xl border border-line px-4 py-2 text-sm capitalize"
              >
                Connect {network}
              </a>
            ))
          : null}
        {hasOutstand() ? (
          <form action="/api/outstand/sync" method="post">
            <button className="rounded-xl border border-line px-4 py-2 text-sm">Sync into Studio</button>
          </form>
        ) : (
          <p className="w-full text-sm text-mute">
            Outstand API keys are already in this laptop’s <code>.env</code> if posting works. If Connect is missing, the org id is empty.
          </p>
        )}
      </div>
      <div className="space-y-2">
        {accounts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-5 py-10 text-mute">
            No accounts here yet. Open Outstand, link the profiles, come back, Sync.
          </p>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel px-5 py-4">
              <div>
                <p className="font-medium">@{account.username}</p>
                <p className="text-sm capitalize text-mute">{account.network}</p>
              </div>
              <form action={saveAccount} className="flex flex-wrap gap-2">
                <input type="hidden" name="id" value={account.id} />
                <input
                  name="nickname"
                  defaultValue={account.nickname}
                  placeholder="Label — personal, OpenArt…"
                  className="field w-52"
                />
                <select name="campaignId" defaultValue={account.campaignId ?? ""} className="field w-48">
                  <option value="">Personal — no deal</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
                <button className="rounded-xl border border-line px-3 py-2 text-sm">Save</button>
              </form>
            </div>
          ))
        )}
      </div>
    </Shell>
  );
}
