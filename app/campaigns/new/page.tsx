import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { isDealKind } from "@/lib/deal-kind";
import { parseLocalDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

async function createCampaign(formData: FormData) {
  "use server";
  const kind = isDealKind(String(formData.get("kind") || "")) ? String(formData.get("kind")) : "UGC";
  const campaign = await prisma.campaign.create({
    data: {
      name: String(formData.get("name") || "Untitled deal"),
      brand: String(formData.get("brand") || ""),
      kind: kind as "TECH" | "UGC",
      videoCount: Number(formData.get("videoCount") || 3),
      deadlineAt: formData.get("deadlineAt") ? parseLocalDate(String(formData.get("deadlineAt"))) : null,
      deliverables: String(formData.get("deliverables") || ""),
      status: (formData.get("status") as "TRIAL" | "ACTIVE") || "TRIAL",
      basePayCents: Math.round(Number(formData.get("basePay") || 0) * 100),
      postsPerDay: Number(formData.get("postsPerDay") || 1),
      accountsAllowed: Number(formData.get("accountsAllowed") || 1),
      minutesPerPost: Number(formData.get("minutesPerPost") || 10),
      monthlyHoursEstimate: Number(formData.get("monthlyHoursEstimate") || 15),
      minViews: Number(formData.get("minViews") || 0),
      approvalFriction: (formData.get("approvalFriction") as "NONE" | "LOW" | "STRICT") || "LOW",
      approvalHours: Number(formData.get("approvalHours") || 24),
      creativeFreedom: Number(formData.get("creativeFreedom") || 3),
      managerName: String(formData.get("managerName") || ""),
      managerResponsive: formData.get("managerResponsive") === "on",
      othersViral: formData.get("othersViral") === "on",
      briefSupply: formData.get("briefSupply") === "on",
      editorIncluded: formData.get("editorIncluded") === "on",
      cpmCents: Math.round(Number(formData.get("cpm") || 0) * 100),
      notes: String(formData.get("notes") || ""),
    },
  });
  redirect(`/campaigns/${campaign.id}`);
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string | number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-mute">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-line bg-lift px-3 py-2"
      />
    </label>
  );
}

export default function NewCampaignPage() {
  return (
    <Shell>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Add a deal</h1>
      <p className="mb-6 text-mute">Canvas / tech is volume. Traditional UGC is a fee and a video count.</p>
      <form action={createCampaign} className="grid max-w-3xl gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-mute">Deal type</span>
          <select name="kind" className="w-full rounded-xl border border-line bg-lift px-3 py-2" defaultValue="UGC">
            <option value="TECH">Canvas / tech</option>
            <option value="UGC">Traditional UGC</option>
          </select>
        </label>
        <Field name="name" label="Campaign" />
        <Field name="brand" label="Brand" />
        <Field name="videoCount" label="Videos owed" type="number" defaultValue={3} />
        <Field name="deadlineAt" label="Deadline" type="date" />
        <label className="md:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-mute">Deliverables</span>
          <textarea name="deliverables" rows={2} placeholder="3 TikToks, 1 Reel, raws…" className="w-full rounded-xl border border-line bg-lift px-3 py-2" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-mute">Status</span>
          <select name="status" className="w-full rounded-xl border border-line bg-lift px-3 py-2">
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Active</option>
          </select>
        </label>
        <Field name="basePay" label="Base pay $" type="number" defaultValue={40} />
        <Field name="postsPerDay" label="Posts / day" type="number" defaultValue={5} />
        <Field name="accountsAllowed" label="Accounts allowed" type="number" defaultValue={1} />
        <Field name="minutesPerPost" label="Minutes / post" type="number" defaultValue={10} />
        <Field name="monthlyHoursEstimate" label="Your hours / month" type="number" defaultValue={15} />
        <Field name="minViews" label="View minimum" type="number" defaultValue={0} />
        <Field name="approvalHours" label="Approval hours" type="number" defaultValue={12} />
        <Field name="creativeFreedom" label="Creative freedom 1-5" type="number" defaultValue={4} />
        <Field name="cpm" label="CPM $" type="number" defaultValue={0} />
        <Field name="managerName" label="Manager" />
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-mute">Approval</span>
          <select name="approvalFriction" className="w-full rounded-xl border border-line bg-lift px-3 py-2">
            <option value="NONE">None</option>
            <option value="LOW">Low</option>
            <option value="STRICT">Strict</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="managerResponsive" defaultChecked /> Responsive manager
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="othersViral" /> Other creators go viral
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="briefSupply" /> Daily briefs
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="editorIncluded" /> Editor included
        </label>
        <label className="md:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-mute">Notes</span>
          <textarea name="notes" rows={4} className="w-full rounded-xl border border-line bg-lift px-3 py-2" />
        </label>
        <button className="rounded-xl bg-sun px-4 py-3 font-semibold text-ink md:col-span-2">Save and score</button>
      </form>
    </Shell>
  );
}
