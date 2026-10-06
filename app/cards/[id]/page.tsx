import { DeleteVideoButton } from "@/components/delete-video";
import { notFound } from "next/navigation";
import { CardBrief } from "@/components/card-brief";
import { CardEditorStage } from "@/components/card-editor-stage";
import { CardFootage } from "@/components/card-footage";
import { CardLive } from "@/components/card-live";
import { MediaRow } from "@/components/media-row";
import { Shell } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { Stepper } from "@/components/stepper";
import { deskStage, isDeskStage, pickFinished } from "@/lib/card-desk";
import { editorNeeds } from "@/lib/editor-packet";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser();
  const [card, campaigns, accounts, editors] = await Promise.all([
    prisma.card.findUnique({
      where: { id },
      include: { campaign: true, account: true, assets: true, editor: true, publishes: { include: { account: { select: { network: true, username: true } } } } },
    }),
    prisma.campaign.findMany({ include: { formats: true } }),
    prisma.socialAccount.findMany({ where: { isActive: true } }),
    prisma.user.findMany({ where: { role: "EDITOR" }, orderBy: { name: "asc" } }),
  ]);
  if (!card) notFound();
  if (user.role === "EDITOR" && card.editorId !== user.id) notFound();
  const desk = user.role === "EDITOR";
  const stage = desk ? "editor" : isDeskStage(query.step) ? query.step : deskStage(card.status);
  const edited = pickFinished(card.assets);
  const cutSource = card.assets
    .filter((asset) => asset.kind === "GENERATED" || (asset.kind === "EDITED" && !asset.filename.startsWith("cut-")))
    .sort((left, right) => +right.createdAt - +left.createdAt)[0];
  const packet = editorNeeds(card);

  return (
    <Shell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-mute">{card.campaign?.name ?? "Personal"}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{card.title}</h1>
        </div>
        <div className="flex items-start gap-3">
          <StatusPill status={card.status} scheduledAt={card.scheduledAt} />
        </div>
      </div>
      {desk ? null : (
        <div className="mb-6 max-w-xl">
          <DeleteVideoButton id={card.id} />
        </div>
      )}
      {desk ? null : (
        <div className="mb-6 max-w-xl">
          <Stepper
            cardId={card.id}
            stage={stage}
            cutBy={card.cutBy}
            scheduled={Boolean(card.scheduledAt)}
            posted={card.status === "POSTED" || card.status === "DATA"}
          />
        </div>
      )}
      <div className="max-w-2xl">
        {stage === "brief" ? <CardBrief card={card} campaigns={campaigns} accounts={accounts} /> : null}
        {stage === "footage" ? <CardFootage card={card} editors={editors} /> : null}
        {stage === "editor" ? (
          <CardEditorStage
            card={card}
            editors={editors}
            packet={packet}
            files={card.assets}
            edited={edited}
            desk={desk}
          />
        ) : null}
        {stage === "live" ? (
          <CardLive
            card={card}
            accounts={accounts}
            assets={card.assets}
            cutSrc={cutSource?.path}
            canUndo={card.assets.some((asset) => asset.kind === "EDITED" && asset.filename.startsWith("cut-"))}
            publishes={card.publishes}
          />
        ) : null}
        <div className="mt-6 space-y-2">
          {card.assets.map((asset) => (
            <MediaRow
              key={asset.id}
              id={asset.id}
              kind={asset.kind}
              filename={asset.filename}
              path={asset.path}
              mime={asset.mime}
              publicUrl={asset.publicUrl}
              canDelete={!desk}
            />
          ))}
        </div>
      </div>
    </Shell>
  );
}
