import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { PIPELINE_META, PIPELINE_STATUSES } from "@/lib/pipeline";
import { prisma } from "@/lib/prisma";
import { toInputDate, toInputDateTime } from "@/lib/dates";
import { publicFileUrl } from "@/lib/files";
import { advanceCard, scheduleCard, updateCard, uploadAsset } from "./actions";
import { VoiceBox } from "@/components/voice-box";

export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [card, campaigns, formats, accounts, editors] = await Promise.all([
    prisma.card.findUnique({
      where: { id },
      include: { campaign: true, format: true, account: true, assets: true, editor: true },
    }),
    prisma.campaign.findMany(),
    prisma.format.findMany(),
    prisma.socialAccount.findMany({ where: { isActive: true } }),
    prisma.user.findMany({ where: { role: "EDITOR" } }),
  ]);
  if (!card) notFound();
  const next = PIPELINE_META[card.status].next;

  return (
    <Shell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-mute">{card.campaign?.name ?? "No deal"}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{card.title}</h1>
        </div>
        <StatusPill status={card.status} />
      </div>
      {next ? (
        <form action={advanceCard.bind(null, card.id, next)} className="mb-6">
          <button className="rounded-xl bg-sun px-4 py-3 text-sm font-semibold text-ink">
            Move to {PIPELINE_META[next].label}
          </button>
        </form>
      ) : null}
      <form action={updateCard} className="grid gap-6 lg:grid-cols-2">
        <input type="hidden" name="id" value={card.id} />
        <div className="space-y-3">
          <input name="title" defaultValue={card.title} className="field" />
          <select name="status" defaultValue={card.status} className="field">
            {PIPELINE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PIPELINE_META[status].label}
              </option>
            ))}
          </select>
          <select name="campaignId" defaultValue={card.campaignId ?? ""} className="field">
            <option value="">No deal</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
          <select name="formatId" defaultValue={card.formatId ?? ""} className="field">
            <option value="">No format</option>
            {formats.map((format) => (
              <option key={format.id} value={format.id}>
                {format.name}
              </option>
            ))}
          </select>
          <select name="accountId" defaultValue={card.accountId ?? ""} className="field">
            <option value="">No account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.network} · @{account.username}
              </option>
            ))}
          </select>
          <select name="editorId" defaultValue={card.editorId ?? ""} className="field">
            <option value="">No editor</option>
            {editors.map((editor) => (
              <option key={editor.id} value={editor.id}>
                {editor.name}
              </option>
            ))}
          </select>
          <input name="referenceUrl" defaultValue={card.referenceUrl} placeholder="Reference URL" className="field" />
          <textarea name="premise" defaultValue={card.premise} placeholder="Premise" className="field min-h-16" />
          <textarea name="hook" defaultValue={card.hook} placeholder="Hook" className="field min-h-16" />
          <textarea name="body" defaultValue={card.body} placeholder="Body" className="field min-h-16" />
          <textarea name="plug" defaultValue={card.plug} placeholder="Plug" className="field min-h-16" />
          <textarea name="script" defaultValue={card.script} placeholder="Script" className="field min-h-40" />
          <textarea name="caption" defaultValue={card.caption} placeholder="Caption" className="field min-h-16" />
          <textarea name="editorNote" defaultValue={card.editorNote} placeholder="Editor note / acceptance" className="field min-h-20" />
          <input name="captionStyle" defaultValue={card.captionStyle} placeholder="Caption style" className="field" />
        </div>
        <div className="space-y-3">
          <label className="text-xs uppercase text-mute">Plan date</label>
          <input name="plannedDate" type="date" defaultValue={card.plannedDate ? toInputDate(card.plannedDate) : ""} className="field" />
          <label className="text-xs uppercase text-mute">Deadline</label>
          <input name="deadlineAt" type="datetime-local" defaultValue={card.deadlineAt ? toInputDateTime(card.deadlineAt) : ""} className="field" />
          <label className="text-xs uppercase text-mute">Schedule</label>
          <input name="scheduledAt" type="datetime-local" defaultValue={card.scheduledAt ? toInputDateTime(card.scheduledAt) : ""} className="field" />
          <input name="payout" type="number" step="0.01" defaultValue={card.payoutCents / 100} className="field" />
          <input name="views" type="number" defaultValue={card.views} className="field" />
          <input name="likes" type="number" defaultValue={card.likes} className="field" />
          <input name="comments" type="number" defaultValue={card.comments} className="field" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="approved" defaultChecked={card.approved} /> Paid / approved
          </label>
          <button className="w-full rounded-xl border border-line px-4 py-3">Save card</button>
        </div>
      </form>
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="mb-3 font-semibold">Drop raws</h2>
          <UploadForm id={card.id} kind="RAW" label="Raw clips" />
          <UploadForm id={card.id} kind="REFERENCE" label="Reference / assets" />
          <VoiceBox cardId={card.id} />
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="mb-3 font-semibold">Edited delivery</h2>
          <UploadForm id={card.id} kind="EDITED" label="Edited video" />
          <form action={scheduleCard} className="mt-4 space-y-2">
            <input type="hidden" name="id" value={card.id} />
            <input name="scheduledAt" type="datetime-local" className="field" />
            <button className="w-full rounded-xl bg-sun px-4 py-3 font-semibold text-ink">Schedule it</button>
          </form>
        </div>
      </section>
      <ul className="mt-6 space-y-2">
        {card.assets.map((asset) => (
          <li key={asset.id} className="flex items-center justify-between rounded-xl border border-line px-4 py-2 text-sm">
            <span>
              {asset.kind} · {asset.filename}
            </span>
            <a className="text-sun" href={publicFileUrl(asset.path)}>
              Open
            </a>
          </li>
        ))}
      </ul>
      <style>{`.field{width:100%;border-radius:12px;border:1px solid #2a2a30;background:#1a1a1e;padding:10px 12px}`}</style>
    </Shell>
  );
}

function UploadForm({ id, kind, label }: { id: string; kind: string; label: string }) {
  return (
    <form action={uploadAsset} className="mb-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <label className="mb-1 block text-xs uppercase text-mute">{label}</label>
      <input name="file" type="file" className="field" />
      <button className="mt-2 rounded-lg border border-line px-3 py-1.5 text-sm">Upload</button>
    </form>
  );
}
