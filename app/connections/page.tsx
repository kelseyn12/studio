import { Shell } from "@/components/shell";
import { hasOutstand, MANAGED_NETWORKS } from "@/lib/outstand";
import { prisma } from "@/lib/prisma";

export default async function ConnectionsPage() {
  const accounts = await prisma.socialAccount.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Accounts</h1>
      <p className="mt-1 mb-6 text-mute">
        Outstand handles Instagram, TikTok, YouTube, Facebook, and the rest. Connect once, schedule from a card.
      </p>
      {!hasOutstand() ? (
        <p className="mb-6 rounded-2xl border border-line bg-panel px-5 py-4 text-sm">
          Add <code>OUTSTAND_API_KEY</code> and <code>OUTSTAND_ORG_ID</code> to <code>.env</code>, then restart.
          You already have Outstand connected at outstand.so — paste the key from that dashboard.
        </p>
      ) : (
        <div className="mb-6 flex flex-wrap gap-2">
          {MANAGED_NETWORKS.map((network) => (
            <a
              key={network}
              href={`/api/outstand/connect?network=${network}`}
              className="rounded-xl bg-sun px-4 py-2 text-sm font-semibold capitalize text-ink"
            >
              Connect {network}
            </a>
          ))}
          <form action="/api/outstand/sync" method="post">
            <button className="rounded-xl border border-line px-4 py-2 text-sm">Sync existing</button>
          </form>
        </div>
      )}
      <div className="space-y-2">
        {accounts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-5 py-10 text-mute">No accounts in Studio yet.</p>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between rounded-2xl border border-line bg-panel px-5 py-4">
              <div>
                <p className="font-medium">@{account.username}</p>
                <p className="text-sm capitalize text-mute">{account.network}</p>
              </div>
              <p className="text-xs text-mute">{account.outstandAccountId}</p>
            </div>
          ))
        )}
      </div>
    </Shell>
  );
}
