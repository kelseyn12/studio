import { approveCut, requestChanges, scheduleCard, sendForTouchUp } from "@/app/cards/[id]/actions";
import { PaidButton } from "@/components/paid-button";
import { QuickCut } from "@/components/quick-cut";
import { toInputDateTime } from "@/lib/dates";
import { formatMoney } from "@/lib/deals";
import { dealAccounts, describeTargets } from "@/lib/targets";
import { publicFileUrl } from "@/lib/urls";

export function CardLive({
  card,
  accounts,
  edited,
}: {
  card: {
    id: string;
    status: string;
    caption: string;
    editorNote: string;
    scheduledAt: Date | null;
    accountId: string | null;
    campaignId: string | null;
    account: { username: string } | null;
    approved: boolean;
    payoutCents: number;
  };
  accounts: Array<{
    id: string;
    username: string;
    nickname: string;
    network: string;
    isActive: boolean;
    campaignId: string | null;
  }>;
  edited?: { id: string; path: string; filename: string; publicUrl: string | null };
}) {
  const dealTargets = dealAccounts(accounts, card.campaignId);
  if (!edited) {
    return (
      <p className="rounded-card border border-dashed border-line bg-panel px-5 py-8 text-sm text-mute">
        Nothing posts until a finished video is here. Make one in Multiply, or drop the finished file on Cuts.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <a
        href={edited.publicUrl || publicFileUrl(edited.path)}
        className="block rounded-xl border border-line px-4 py-3 text-center"
      >
        Watch {edited.filename}
      </a>
      {card.status === "REVIEW" || (card.status === "READY" && !card.scheduledAt) ? (
        <details className="rounded-card border border-line bg-panel px-5 py-4">
          <summary className="cursor-pointer text-sm font-semibold">Quick cut — trim the start or end</summary>
          <div className="mt-3">
            <QuickCut
              src={edited.publicUrl || publicFileUrl(edited.path)}
              target="asset"
              id={edited.id}
              note="Makes a new cut of this video. The newest cut is the one that ships."
            />
          </div>
        </details>
      ) : null}
      {card.status === "POSTED" || card.status === "DATA" ? (
        <div className="flex items-center justify-between rounded-card border border-line bg-panel px-5 py-4">
          <p className="text-sm text-mute">
            {card.approved
              ? "Money counted on Today."
              : card.payoutCents > 0
                ? `This video is worth ${formatMoney(card.payoutCents)}. Tap when the brand pays.`
                : "Tap when the brand pays for this video."}
          </p>
          <PaidButton card={card} />
        </div>
      ) : null}
      {card.status === "REVIEW" ? (
        <>
          <form action={approveCut} className="rounded-card border border-line bg-panel p-5">
            <input type="hidden" name="id" value={card.id} />
            <p className="text-sm text-mute">Approve this cut. Then schedule the account and day below.</p>
            <button className="mt-3 w-full rounded-xl bg-sun px-4 py-3 font-semibold text-ink">Approve</button>
          </form>
          <form action={requestChanges} className="space-y-3 rounded-card border border-line bg-panel p-5">
            <input type="hidden" name="id" value={card.id} />
            <p className="text-sm text-mute">Needs changes. They see this note on Cuts and drop a new finished video.</p>
            <textarea
              name="editorNote"
              defaultValue={card.editorNote}
              placeholder="What to fix — hook, captions, end frame…"
              className="field min-h-24"
              required
            />
            <button className="w-full rounded-xl border border-line px-4 py-3 font-semibold">Needs changes</button>
          </form>
        </>
      ) : null}
      {card.status === "READY" && !card.scheduledAt ? (
        <form action={sendForTouchUp} className="space-y-3 rounded-card border border-line bg-panel p-5">
          <input type="hidden" name="id" value={card.id} />
          <p className="text-sm text-mute">
            Not quite right? Send it to your editor to polish. They drop the fixed video and it lands back in To
            approve.
          </p>
          <textarea
            name="editorNote"
            placeholder="What to polish — trim the hook, tighten the end, fix captions…"
            className="field min-h-20"
            required
          />
          <button className="w-full rounded-xl border border-line px-4 py-3 font-semibold">Send to editor to polish</button>
        </form>
      ) : null}
      <form action={scheduleCard} className="space-y-3 rounded-card border border-line bg-panel p-5">
        <input type="hidden" name="id" value={card.id} />
        <p className="text-sm text-mute">
          {dealTargets.length > 0
            ? `Schedule it. Posts to ${describeTargets(dealTargets)} at the time you set — one post, every account on this deal.`
            : `Schedule it. ${card.account ? `@${card.account.username}` : "Pick an account"} gets this video at the time you set.`}
        </p>
        <textarea name="caption" defaultValue={card.caption} placeholder="Caption that ships with the video" className="field min-h-24" />
        <input
          name="scheduledAt"
          type="datetime-local"
          defaultValue={card.scheduledAt ? toInputDateTime(card.scheduledAt) : ""}
          className="field"
          required
        />
        {dealTargets.length === 0 ? (
          <select name="accountId" defaultValue={card.accountId ?? ""} className="field" required>
            <option value="">Which account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.nickname ? `${account.nickname} · ` : ""}@{account.username}
              </option>
            ))}
          </select>
        ) : null}
        <button className="w-full rounded-xl border border-line px-4 py-3 font-semibold">Schedule</button>
      </form>
    </div>
  );
}
