import { approveCut, scheduleCard } from "@/app/cards/[id]/actions";
import { toInputDateTime } from "@/lib/dates";
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
    scheduledAt: Date | null;
    accountId: string | null;
    account: { username: string } | null;
  };
  accounts: Array<{ id: string; username: string; nickname: string }>;
  edited?: { path: string; filename: string; publicUrl: string | null };
}) {
  if (!edited) {
    return (
      <p className="rounded-card border border-dashed border-line bg-panel px-5 py-8 text-sm text-mute">
        Nothing publishes from here until a finished file exists. Generate in Multiply, or drop the 1080 on Cuts.
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
      {card.status === "REVIEW" ? (
        <form action={approveCut} className="rounded-card border border-line bg-panel p-5">
          <input type="hidden" name="id" value={card.id} />
          <p className="text-sm text-mute">Looks good? It goes to the Library. Park it on Live when you are ready.</p>
          <button className="mt-3 w-full rounded-xl bg-sun px-4 py-3 font-semibold text-ink">Looks good</button>
        </form>
      ) : null}
      <form action={scheduleCard} className="space-y-3 rounded-card border border-line bg-panel p-5">
        <input type="hidden" name="id" value={card.id} />
        <p className="text-sm text-mute">
          Park it. {card.account ? `@${card.account.username}` : "Pick an account"} gets the file at the time you set.
        </p>
        <textarea name="caption" defaultValue={card.caption} placeholder="Caption that ships with the video" className="field min-h-24" />
        <input
          name="scheduledAt"
          type="datetime-local"
          defaultValue={card.scheduledAt ? toInputDateTime(card.scheduledAt) : ""}
          className="field"
          required
        />
        <select name="accountId" defaultValue={card.accountId ?? ""} className="field" required>
          <option value="">Post as</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.nickname ? `${account.nickname} · ` : ""}@{account.username}
            </option>
          ))}
        </select>
        <button className="w-full rounded-xl border border-line px-4 py-3 font-semibold">Park on Live</button>
      </form>
    </div>
  );
}
