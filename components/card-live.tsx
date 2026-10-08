import { markDelivered } from "@/app/calendar/actions";
import { scheduleCard, updateScheduledCaption } from "@/app/cards/[id]/actions";
import { PolishAsk, ReviewAsk } from "@/components/review-ask";
import { LiveLooks } from "@/components/live-looks";
import { PaidButton } from "@/components/paid-button";
import { QuickCut } from "@/components/quick-cut";
import { ScheduleButton } from "@/components/schedule-button";
import { pickFinished, shipLooks } from "@/lib/card-desk";
import { labelWhen } from "@/lib/dates";
import { formatMoney } from "@/lib/deals";
import { coverCanChange } from "@/lib/post-cover";
import { dealAccounts, describeTargets, handle, parseAccountIds, targetAccounts } from "@/lib/targets";
import { YouTubeMiss, youtubeDownload } from "@/components/youtube-miss";
import { canMarkDelivered, deliveredLabel } from "@/lib/deliver";
import { postedAppLine } from "@/lib/publish-sync";
import { isStill } from "@/lib/files";
import { watchUrl } from "@/lib/urls";

type LiveAsset = {
  id: string;
  path: string;
  filename: string;
  kind: string;
  createdAt: Date;
  textStyle: string;
  publicUrl: string | null;
  coverPath?: string;
  coverAt?: number;
};

export function CardLive({
  card,
  accounts,
  assets,
  canUndo,
  cutSrc,
  publishes = [],
}: {
  card: {
    id: string;
    title: string;
    status: string;
    caption: string;
    editorNote: string;
    youtubeUrl?: string;
    scheduledAt: Date | null;
    accountId: string | null;
    accountIds?: string;
    campaignId: string | null;
    cutBy?: "SELF" | "EDITOR";
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
  assets: LiveAsset[];
  canUndo?: boolean;
  cutSrc?: string;
  publishes?: Array<{
    id: string;
    status: string;
    error: string | null;
    createdAt: Date;
    account: { network: string };
  }>;
}) {
  const dealTargets = dealAccounts(accounts, card.campaignId);
  const targets = targetAccounts(accounts, card);
  const looks = shipLooks(assets, targets);
  const edited = pickFinished(assets);
  const selectedIds = parseAccountIds(card.accountIds).length
    ? parseAccountIds(card.accountIds)
    : dealTargets.length
      ? dealTargets.map((account) => account.id)
      : card.accountId
        ? [card.accountId]
        : [];
  const posted = postedAppLine(publishes.map((job) => ({ status: job.status, network: job.account.network })));
  const youtubeMiss = publishes.filter((job) => job.status === "FAILED" && job.account.network === "youtube");
  if (!edited) {
    return (
      <p className="rounded-card border border-dashed border-line bg-panel px-5 py-8 text-sm text-mute">
        Nothing posts until a finished video is here. Make one in Multiply, or drop the finished file on Cuts.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {card.status === "REVIEW" || (card.status === "READY" && !card.scheduledAt) ? (
        <details className="rounded-card border border-line bg-panel px-5 py-4">
          <summary className="cursor-pointer text-sm font-semibold">Cut and speed — drop dragging parts, then post from here</summary>
          <div className="mt-3">
            <QuickCut
              src={watchUrl(cutSrc || edited.path)}
              target="asset"
              id={edited.id}
              canUndo={canUndo}
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
      {card.status === "REVIEW" && card.cutBy !== "SELF" ? (
        <ReviewAsk
          cardId={card.id}
          shots={assets
            .filter((file) => file.kind === "REFERENCE" && isStill(file.filename))
            .map((file) => ({ id: file.id, path: file.path, filename: file.filename }))}
        />
      ) : null}
      {card.status === "READY" && !card.scheduledAt && card.cutBy !== "SELF" ? <PolishAsk cardId={card.id} /> : null}
      {canMarkDelivered(card.status, card.scheduledAt, true) ? (
        <form action={markDelivered} className="rounded-card border border-line bg-panel p-5">
          <p className="text-sm">
            Going to the brand, like Trybe? Mark it sent. That does not post Instagram, TikTok, YouTube, or Facebook.
          </p>
          <input type="hidden" name="id" value={card.id} />
          <button type="submit" className="mt-3 w-full rounded-xl border border-line px-4 py-3 font-semibold">
            Sent to the brand
          </button>
        </form>
      ) : null}
      <form action={card.scheduledAt ? updateScheduledCaption : scheduleCard} className="space-y-3">
        <input type="hidden" name="id" value={card.id} />
        <p className="text-sm text-mute">
          {looks.length === 1 && looks[0]?.look === "plain"
            ? "One video. Check every account it should go to."
            : "This video only posts the file you dropped. Check the accounts for that version. The other version is the other name."}
        </p>
        <LiveLooks
          cardId={card.id}
          rows={looks}
          canCover={coverCanChange(card.status)}
          accounts={accounts}
          selectedIds={selectedIds}
        />
        <div className="space-y-3 rounded-card border border-line bg-panel p-5">
        <p className="text-sm text-mute">
          {looks.length > 1
            ? looks
                .map((row) =>
                  row.accounts.length
                    ? `${row.tag} → ${describeTargets(row.accounts)}`
                    : `${row.tag} — pick the accounts on that mix`,
                )
                .join(". ")
            : dealTargets.length > 0
              ? `Posts to ${describeTargets(dealTargets)} at the time you set.`
              : `${card.account ? handle(card.account.username) : looks[0]?.look === "plain" ? "Pick the accounts below" : "Pick accounts on each look"} at the time you set.`}
        </p>
        <label className="block text-sm">
          Caption on every app
          <span className="mt-1 block text-xs font-normal text-mute">
            The text under the video — same on IG, TikTok, YouTube, and Facebook. Words already on the video stay in the
            file; change those on Multiply → Words + music.
          </span>
          <textarea
            name="caption"
            defaultValue={card.caption}
            placeholder="Leave blank for no caption"
            className="field mt-2 min-h-24"
          />
        </label>
        <p className="text-xs text-mute">Leave this blank and the post goes out with no caption.</p>
        {card.status === "POSTED" || card.status === "DATA" ? (
          <p className="text-sm font-semibold text-live">
            {deliveredLabel(card.status, publishes.length) ?? `Posted${posted ? ` · ${posted}` : ""}`}
          </p>
        ) : card.scheduledAt ? (
          <>
            <p className="text-sm">
              Already set for {labelWhen(card.scheduledAt)}. Changing the caption does not send it again.
            </p>
            <ScheduleButton
              label="Update caption for scheduled post"
              pendingLabel="Updating caption…"
              className="w-full rounded-xl border border-line px-4 py-3 font-semibold"
            />
          </>
        ) : (
          <>
            <label className="block text-sm">
              When it posts
              <input name="scheduledAt" type="datetime-local" className="field mt-2" required />
            </label>
            <ScheduleButton label="Schedule" className="w-full rounded-xl border border-line px-4 py-3 font-semibold" />
          </>
        )}
        </div>
      </form>
      {card.status === "POSTED" || card.status === "DATA"
        ? youtubeMiss.map((job) => (
            <YouTubeMiss
              key={job.id}
              jobId={job.id}
              failedAt={job.createdAt}
              download={youtubeDownload(assets)}
              youtubeUrl={card.youtubeUrl}
            />
          ))
        : null}
    </div>
  );
}
