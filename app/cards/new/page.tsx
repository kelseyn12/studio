import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function createCard(formData: FormData) {
  "use server";
  const user = await requireUser();
  const count = Number(formData.get("count") || 1);
  const campaignId = String(formData.get("campaignId") || "") || null;
  const formatId = String(formData.get("formatId") || "") || null;
  const title = String(formData.get("title") || "Untitled card");
  const created = [];
  for (let index = 0; index < Math.min(count, 40); index += 1) {
    created.push(
      prisma.card.create({
        data: {
          title: count > 1 ? `${title} ${index + 1}` : title,
          campaignId,
          formatId,
          createdById: user.id,
          premise: String(formData.get("premise") || ""),
          hook: String(formData.get("hook") || ""),
          body: String(formData.get("body") || ""),
          plug: String(formData.get("plug") || ""),
          script: String(formData.get("script") || ""),
          referenceUrl: String(formData.get("referenceUrl") || ""),
          caption: String(formData.get("caption") || ""),
          status: formData.get("script") ? "SCRIPTED" : "IDEA",
        },
      }),
    );
  }
  const cards = await Promise.all(created);
  redirect(cards.length === 1 ? `/cards/${cards[0].id}` : "/pipeline");
}

export default async function NewCardPage() {
  const [campaigns, formats] = await Promise.all([
    prisma.campaign.findMany({ orderBy: { name: "asc" } }),
    prisma.format.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <Shell>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">New cards</h1>
      <p className="mb-6 text-mute">Batch by mode. Write the batch, then film the batch.</p>
      <form action={createCard} className="grid max-w-3xl gap-4">
        <input name="title" required placeholder="Title / series name" className="rounded-xl border border-line bg-lift px-3 py-3" />
        <div className="grid gap-3 md:grid-cols-3">
          <select name="campaignId" className="rounded-xl border border-line bg-lift px-3 py-2">
            <option value="">No deal</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
          <select name="formatId" className="rounded-xl border border-line bg-lift px-3 py-2">
            <option value="">No format</option>
            {formats.map((format) => (
              <option key={format.id} value={format.id}>
                {format.name}
              </option>
            ))}
          </select>
          <input name="count" type="number" defaultValue={1} min={1} max={40} className="rounded-xl border border-line bg-lift px-3 py-2" />
        </div>
        <input name="referenceUrl" placeholder="Reference video URL" className="rounded-xl border border-line bg-lift px-3 py-2" />
        <textarea name="premise" rows={2} placeholder="Premise — what payoff does the viewer get?" className="rounded-xl border border-line bg-lift px-3 py-2" />
        <textarea name="hook" rows={2} placeholder="Hook — visual + text + spoken line" className="rounded-xl border border-line bg-lift px-3 py-2" />
        <textarea name="body" rows={2} placeholder="Body" className="rounded-xl border border-line bg-lift px-3 py-2" />
        <textarea name="plug" rows={2} placeholder="Plug — how the brand shows up" className="rounded-xl border border-line bg-lift px-3 py-2" />
        <textarea name="script" rows={6} placeholder="Full script" className="rounded-xl border border-line bg-lift px-3 py-2" />
        <textarea name="caption" rows={2} placeholder="Caption" className="rounded-xl border border-line bg-lift px-3 py-2" />
        <button className="rounded-xl bg-sun px-4 py-3 font-semibold text-ink">Create batch</button>
      </form>
    </Shell>
  );
}
