import { finishStage, updateCard } from "@/app/cards/[id]/actions";
import { DropZone } from "@/components/drop-zone";
import { BriefAi } from "@/components/hook-rewrite";
import { DEAL_KIND_LABEL } from "@/lib/deal-kind";
import { toInputDate } from "@/lib/dates";
import { REFERENCE_MAX_BYTES } from "@/lib/files";
import type { DealKind } from "@prisma/client";

export function CardBrief({
  card,
  campaigns,
  accounts,
}: {
  card: {
    id: string;
    title: string;
    premise: string;
    hook: string;
    body: string;
    plug: string;
    script: string;
    referenceUrl: string;
    campaignId: string | null;
    accountId: string | null;
    plannedDate: Date | null;
    deadlineAt: Date | null;
  };
  campaigns: Array<{ id: string; name: string; brand: string; kind: DealKind }>;
  accounts: Array<{ id: string; username: string; nickname: string }>;
}) {
  return (
    <div className="space-y-3">
      <form action={finishStage.bind(null, "brief")} className="space-y-3">
        <input type="hidden" name="id" value={card.id} />
        <p className="text-sm text-mute">Write it. Pick the day you will film and which account it is for. This does not publish.</p>
        <input name="title" defaultValue={card.title} className="field" placeholder="Title" />
        <select name="accountId" defaultValue={card.accountId ?? ""} className="field">
          <option value="">Which account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.nickname ? `${account.nickname} · ` : ""}@{account.username}
            </option>
          ))}
        </select>
        <select name="campaignId" defaultValue={card.campaignId ?? ""} className="field">
          <option value="">Personal — no deal</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {DEAL_KIND_LABEL[campaign.kind]} · {campaign.brand || campaign.name}
            </option>
          ))}
        </select>
        <label>
          <span className="label">Film this day</span>
          <input name="plannedDate" type="date" defaultValue={card.plannedDate ? toInputDate(card.plannedDate) : ""} className="field" />
        </label>
        <label>
          <span className="label">Editor deadline</span>
          <input name="deadlineAt" type="date" defaultValue={card.deadlineAt ? toInputDate(card.deadlineAt) : ""} className="field" />
        </label>
        <input name="referenceUrl" defaultValue={card.referenceUrl} placeholder="Reference link (optional)" className="field" />
        <textarea name="premise" defaultValue={card.premise} placeholder="Payoff — why would someone watch" className="field min-h-16" />
        <textarea name="hook" defaultValue={card.hook} placeholder="Hook — first line + first visual" className="field min-h-16" />
        <BriefAi cardId={card.id} />
        <textarea name="body" defaultValue={card.body} placeholder="Body / demo" className="field min-h-16" />
        <textarea name="plug" defaultValue={card.plug} placeholder="CTA / plug" className="field min-h-16" />
        <textarea name="script" defaultValue={card.script} placeholder="Full script and shot notes" className="field min-h-32" />
        <div className="flex gap-2">
          <button formAction={updateCard} className="flex-1 rounded-xl border border-line py-3">
            Save
          </button>
          <button className="flex-1 rounded-xl bg-sun py-3 font-semibold text-ink">Finish brief</button>
        </div>
      </form>
      <DropZone
        action="/api/assets"
        extra={{ id: card.id, kind: "REFERENCE" }}
        label="Reference video or still"
        hint="Short phone clip the AI can match. Not a 4K day. Under 40MB."
        accept="video/*,image/*"
        maxBytes={REFERENCE_MAX_BYTES}
      />
    </div>
  );
}
