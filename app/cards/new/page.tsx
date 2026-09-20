import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { DEAL_KIND_LABEL } from "@/lib/deal-kind";
import { parseLocalDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

async function createCard(formData: FormData) {
  "use server";
  const user = await requireUser();
  const count = Number(formData.get("count") || 1);
  const campaignId = String(formData.get("campaignId") || "") || null;
  const title = String(formData.get("title") || "Untitled");
  const planned = formData.get("plannedDate") ? parseLocalDate(String(formData.get("plannedDate"))) : null;
  const created = await Promise.all(
    Array.from({ length: Math.min(count, 40) }, (_, index) =>
      prisma.card.create({
        data: {
          title: count > 1 ? `${title} ${index + 1}` : title,
          campaignId,
          plannedDate: planned,
          createdById: user.id,
        },
      }),
    ),
  );
  redirect(created.length === 1 ? `/cards/${created[0].id}?step=brief` : "/plan");
}

export default async function NewCardPage() {
  const campaigns = await prisma.campaign.findMany({ orderBy: { name: "asc" } });
  const { DEAL_KIND_LABEL } = await import("@/lib/deal-kind");
  return (
    <Shell>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Add one</h1>
      <p className="mb-6 text-mute">A card is a promise to film. The script comes next, on Brief.</p>
      <form action={createCard} className="grid max-w-xl gap-4">
        <input name="title" required placeholder="Title" className="field" />
        <input name="plannedDate" type="date" className="field" />
        <select name="campaignId" className="field">
          <option value="">Personal — no deal</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {DEAL_KIND_LABEL[campaign.kind]} · {campaign.brand || campaign.name}
            </option>
          ))}
        </select>
        <label>
          <span className="label">How many</span>
          <input name="count" type="number" defaultValue={1} min={1} max={40} className="field" />
        </label>
        <button className="rounded-xl bg-sun px-4 py-3 font-semibold text-ink">Create</button>
      </form>
    </Shell>
  );
}
