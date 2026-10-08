import { redirect } from "next/navigation";
import { NewVideosForm } from "@/components/new-videos-form";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { parseLocalDate } from "@/lib/dates";
import { DEAL_KIND_LABEL } from "@/lib/deal-kind";
import { videoTitles } from "@/lib/new-videos";
import { placeFromForm } from "@/lib/video-home";
import { prisma } from "@/lib/prisma";

async function createCard(formData: FormData) {
  "use server";
  const user = await requireUser();
  const titles = videoTitles(formData.getAll("title").map(String));
  if (!titles.length) redirect("/cards/new");
  const place = placeFromForm(String(formData.get("place") || formData.get("campaignId") || ""));
  const planned = formData.get("plannedDate") ? parseLocalDate(String(formData.get("plannedDate"))) : null;
  const created = await Promise.all(
    titles.map((title) =>
      prisma.card.create({
        data: {
          title,
          campaignId: place.campaignId,
          home: place.home,
          plannedDate: planned,
          createdById: user.id,
          status: "FILMED",
          cutBy: "SELF",
        },
      }),
    ),
  );
  redirect(created.length === 1 ? `/cards/${created[0].id}?step=editor` : "/edits");
}

export default async function NewCardPage() {
  const campaigns = await prisma.campaign.findMany({ orderBy: { name: "asc" } });
  return (
    <Shell>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Add videos</h1>
      <p className="mb-6 text-mute">Name each one. Next you drop the finished file, then set the thumbnail, accounts, caption, and time.</p>
      <NewVideosForm
        action={createCard}
        deals={campaigns.map((campaign) => ({
          id: campaign.id,
          label: `${DEAL_KIND_LABEL[campaign.kind]} · ${campaign.brand || campaign.name}`,
        }))}
      />
    </Shell>
  );
}
