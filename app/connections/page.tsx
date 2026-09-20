import { Shell } from "@/components/shell";
import { hasOutstand, MANAGED_NETWORKS } from "@/lib/outstand";
import { prisma } from "@/lib/prisma";
import { renameAccount } from "./actions";

export default async function ConnectionsPage() {
  const accounts = await prisma.socialAccount.findMany({ orderBy: { createdAt: "desc" } });
  const canConnect = hasOutstand() && Boolean(process.env.OUTSTAND_ORG_ID);

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Accounts</h1>
      <p className="mt-1 mb-6 max-w-2xl text-mute">
        Personal and campaign accounts all live here. Connect brand pages in Outstand, Sync, then pick
        which one a batch posts as. Label them so you do not mix personal with OpenArt.
      </p>
      {!hasOutstand() ? (
        <p className="mb-6 rounded-2xl border border-line bg-panel px-5 py-4 text-sm">
          Add <code>OUTSTAND_API_KEY</code> and <code>OUTSTAND_ORG_ID</code> to <code>.env</code>, then restart.
        </p>
      ) : (
        <div className="mb-6 flex flex-wrap gap-2">
          {canConnect
            ? MANAGED_NETWORKS.map((network) => (
                <a
                  key={network}
                  href={`/api/outstand/connect?network=${network}`}
                  className="rounded-xl bg-sun px-4 py-2 text-sm font-semibold capitalize text-ink"
                >
                  Connect {network}
                </a>
              ))
            : null}
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
            <div key={account.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel px-5 py-4">
              <div>
                <p className="font-medium">@{account.username}</p>
                <p className="text-sm capitalize text-mute">{account.network}</p>
              </div>
              <form action={renameAccount} className="flex gap-2">
                <input type="hidden" name="id" value={account.id} />
                <input
                  name="nickname"
                  defaultValue={account.nickname}
                  placeholder="Label — personal, OpenArt…"
                  className="field w-52"
                />
                <button className="rounded-xl border border-line px-3 py-2 text-sm">Save</button>
              </form>
            </div>
          ))
        )}
      </div>
    </Shell>
  );
}
