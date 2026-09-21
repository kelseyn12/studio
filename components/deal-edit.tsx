import { updateDeal } from "@/app/campaigns/[id]/actions";

export function DealEdit({
  deal,
}: {
  deal: {
    id: string;
    name: string;
    brand: string;
    status: string;
    basePayCents: number;
    cpmCents: number;
    videoCount: number;
    postsPerDay: number;
    accountsAllowed: number;
    deliverables: string;
  };
}) {
  return (
    <details className="mb-8 rounded-card border border-line bg-panel">
      <summary className="cursor-pointer px-5 py-4 font-semibold">Edit this deal</summary>
      <form action={updateDeal} className="grid gap-3 px-5 pb-5 md:grid-cols-2">
        <input type="hidden" name="id" value={deal.id} />
        <label className="text-sm">
          Deal name
          <input name="name" defaultValue={deal.name} className="field mt-1" required />
        </label>
        <label className="text-sm">
          Brand
          <input name="brand" defaultValue={deal.brand} className="field mt-1" />
        </label>
        <label className="text-sm">
          Pay per video ($)
          <input
            name="basePay"
            type="number"
            min={0}
            step="0.01"
            defaultValue={(deal.basePayCents / 100).toFixed(2)}
            className="field mt-1"
          />
        </label>
        <label className="text-sm">
          CPM — $ per 1,000 views (0 if none)
          <input
            name="cpm"
            type="number"
            min={0}
            step="0.01"
            defaultValue={(deal.cpmCents / 100).toFixed(2)}
            className="field mt-1"
          />
        </label>
        <label className="text-sm">
          Videos promised
          <input name="videoCount" type="number" min={1} defaultValue={deal.videoCount} className="field mt-1" />
        </label>
        <label className="text-sm">
          Posts per day
          <input name="postsPerDay" type="number" min={1} defaultValue={deal.postsPerDay} className="field mt-1" />
        </label>
        <label className="text-sm">
          Accounts allowed
          <input
            name="accountsAllowed"
            type="number"
            min={1}
            defaultValue={deal.accountsAllowed}
            className="field mt-1"
          />
        </label>
        <label className="text-sm">
          Status
          <select name="status" defaultValue={deal.status} className="field mt-1">
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="ENDED">Ended</option>
          </select>
        </label>
        <label className="text-sm md:col-span-2">
          What they expect
          <textarea name="deliverables" defaultValue={deal.deliverables} className="field mt-1 min-h-20" />
        </label>
        <button className="rounded-xl bg-sun px-4 py-3 font-semibold text-ink md:col-span-2">Save deal</button>
      </form>
    </details>
  );
}
