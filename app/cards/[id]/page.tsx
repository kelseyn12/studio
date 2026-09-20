import { notFound } from "next/navigation";
import { DropZone } from "@/components/drop-zone";
import { MediaRow } from "@/components/media-row";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { Stepper } from "@/components/stepper";
import { VoiceBox } from "@/components/voice-box";
import { toInputDate, toInputDateTime } from "@/lib/dates";
import { publicFileUrl } from "@/lib/urls";
import { PIPELINE_META, PIPELINE_STATUSES } from "@/lib/pipeline";
import { prisma } from "@/lib/prisma";
import { EditorNeed } from "@/components/editor-need";
import { editorNeeds } from "@/lib/editor-packet";
import { advanceCard, scheduleCard, updateCard } from "./actions";

export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [card, campaigns, formats, accounts] = await Promise.all([
    prisma.card.findUnique({
      where: { id },
      include: { campaign: true, format: true, account: true, assets: true },
    }),
    prisma.campaign.findMany(),
    prisma.format.findMany(),
    prisma.socialAccount.findMany({ where: { isActive: true } }),
  ]);
  if (!card) notFound();
  const next = PIPELINE_META[card.status].next;
  const edited = card.assets.find((asset) => asset.kind === "EDITED" || asset.kind === "GENERATED");
  const packet = editorNeeds(card);

  return (
    <Shell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-mute">{card.campaign?.name ?? "No deal yet"}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{card.title}</h1>
        </div>
        <StatusPill status={card.status} />
      </div>
      <div className="mb-6 max-w-xl">
        <Stepper status={card.status} />
      </div>
      {next ? (
        <form action={advanceCard.bind(null, card.id, next)} className="mb-8">
          <button className="rounded-xl bg-sun px-4 py-3 text-sm font-semibold text-ink">
            Move to {PIPELINE_META[next].label}
          </button>
        </form>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-2">
        <form action={updateCard} className="space-y-3">
          <input type="hidden" name="id" value={card.id} />
          <input type="hidden" name="editorId" value={card.editorId ?? ""} />
          <input type="hidden" name="likes" value={card.likes} />
          <input type="hidden" name="comments" value={card.comments} />
          <input name="title" defaultValue={card.title} className="field" />
          <select name="status" defaultValue={card.status} className="field">
            {PIPELINE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PIPELINE_META[status].label}
              </option>
            ))}
          </select>
          <select name="campaignId" defaultValue={card.campaignId ?? ""} className="field">
            <option value="">Brand / deal</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
          <select name="formatId" defaultValue={card.formatId ?? ""} className="field">
            <option value="">Format</option>
            {formats.map((format) => (
              <option key={format.id} value={format.id}>
                {format.name}
              </option>
            ))}
          </select>
          <select name="accountId" defaultValue={card.accountId ?? ""} className="field">
            <option value="">Account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.network} · @{account.username}
              </option>
            ))}
          </select>
          <input name="referenceUrl" defaultValue={card.referenceUrl} placeholder="Reference link" className="field" />
          <textarea name="premise" defaultValue={card.premise} placeholder="Premise — what payoff does the viewer get?" className="field min-h-16" />
          <textarea name="hook" defaultValue={card.hook} placeholder="Hook — visual + spoken line" className="field min-h-16" />
          <textarea name="body" defaultValue={card.body} placeholder="Body / demo" className="field min-h-16" />
          <textarea name="plug" defaultValue={card.plug} placeholder="Plug — how the brand shows up" className="field min-h-16" />
          <textarea name="script" defaultValue={card.script} placeholder="Full script" className="field min-h-32" />
          <textarea name="caption" defaultValue={card.caption} placeholder="Caption" className="field min-h-16" />
          <textarea name="editorNote" defaultValue={card.editorNote} placeholder="Note for CapCut / editor" className="field min-h-20" />
          <input name="plannedDate" type="date" defaultValue={card.plannedDate ? toInputDate(card.plannedDate) : ""} className="field" />
          <input name="payout" type="number" step="0.01" defaultValue={card.payoutCents / 100} className="field" />
          <input name="views" type="number" defaultValue={card.views} className="field" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="approved" defaultChecked={card.approved} /> Paid / approved
          </label>
          <input name="captionStyle" type="hidden" defaultValue={card.captionStyle} />
          <button className="w-full rounded-xl border border-line py-3">Save</button>
        </form>

        <div className="space-y-4">
          <section className="rounded-card border border-line bg-panel p-5">
            <h2 className="mb-1 font-semibold">Editor packet</h2>
            <p className="mb-3 text-sm text-mute">CapCut should not have to guess. Fill the gaps before you hand off.</p>
            <EditorNeed items={packet} />
          </section>
          <section className="rounded-card border border-line bg-panel p-5">
            <h2 className="mb-1 font-semibold">Raws + brief</h2>
            <p className="mb-4 text-sm text-mute">Drop footage. Talk the brief. CapCut can wait.</p>
            <DropZone action="/api/assets" extra={{ id: card.id, kind: "RAW" }} label="Drop raws" accept="video/*,image/*,audio/*" />
            <div className="mt-3">
              <DropZone action="/api/assets" extra={{ id: card.id, kind: "REFERENCE" }} label="Reference / stills" />
            </div>
            <VoiceBox cardId={card.id} />
          </section>
          <section className="rounded-card border border-line bg-panel p-5">
            <h2 className="mb-1 font-semibold">CapCut delivery</h2>
            <p className="mb-4 text-sm text-mute">Export from CapCut, drop it here, schedule.</p>
            <DropZone action="/api/assets" extra={{ id: card.id, kind: "EDITED" }} label="Drop the cut" accept="video/*" />
            {edited ? (
              <a href={publicFileUrl(edited.path)} className="mt-4 block rounded-xl bg-sun px-4 py-3 text-center font-semibold text-ink">
                Open the delivered video
              </a>
            ) : null}
            <form action={scheduleCard} className="mt-4 space-y-2">
              <input type="hidden" name="id" value={card.id} />
              <input
                name="scheduledAt"
                type="datetime-local"
                defaultValue={card.scheduledAt ? toInputDateTime(card.scheduledAt) : ""}
                className="field"
              />
              <button className="w-full rounded-xl bg-sun px-4 py-3 font-semibold text-ink">Schedule it</button>
            </form>
          </section>
          <div className="space-y-2">
            {card.assets.map((asset) => (
              <MediaRow key={asset.id} kind={asset.kind} filename={asset.filename} path={asset.path} mime={asset.mime} />
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
