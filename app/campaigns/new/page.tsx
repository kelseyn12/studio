import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { isDealKind } from "@/lib/deal-kind";
import { parseLocalDate } from "@/lib/dates";
import { perVideoCents } from "@/lib/deal-bonuses";
import { prisma } from "@/lib/prisma";

async function createCampaign(formData: FormData) {
  "use server";
  const kind = isDealKind(String(formData.get("kind") || "")) ? String(formData.get("kind")) : "UGC";
  const videoCount = Number(formData.get("videoCount") || 3);
  const monthlyPayCents = Math.max(0, Math.round(Number(formData.get("monthlyPay") || 0) * 100));
  const campaign = await prisma.campaign.create({
    data: {
      name: String(formData.get("name") || "Untitled deal"),
      brand: String(formData.get("brand") || ""),
      kind: kind as "TECH" | "UGC",
      videoCount,
      deadlineAt: formData.get("deadlineAt") ? parseLocalDate(String(formData.get("deadlineAt"))) : null,
      deliverables: String(formData.get("deliverables") || ""),
      status: (formData.get("status") as "TRIAL" | "ACTIVE") || "TRIAL",
      monthlyPayCents,
      basePayCents: monthlyPayCents > 0 ? perVideoCents(monthlyPayCents, videoCount) : Math.round(Number(formData.get("basePay") || 0) * 100),
      postsPerDay: Number(formData.get("postsPerDay") || 1),
      postsPerDayMax: Number(formData.get("postsPerDayMax") || 0),
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

function Section({ title }: { title: string }) {
  return <p className="label mt-2 md:col-span-2">{title}</p>;
}

export default function NewCampaignPage() {
  return (
    <Shell>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Add a deal</h1>
      <p className="mb-6 text-mute">
        Fill what you know. Everything here can be changed on the deal page later, and view bonuses go there too.
      </p>
      <form action={createCampaign} className="grid max-w-3xl gap-4 md:grid-cols-2">
        <Section title="The deal" />
        <label className="block md:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-mute">Deal type</span>
          <select name="kind" className="w-full rounded-xl border border-line bg-lift px-3 py-2" defaultValue="UGC">
            <option value="TECH">Canvas / tech — volume, posting every day</option>
            <option value="UGC">Traditional UGC — a fee for a few videos</option>
          </select>
        </label>
        <Field name="name" label="Deal name" />
        <Field name="brand" label="Brand" />
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-mute">Status</span>
          <select name="status" className="w-full rounded-xl border border-line bg-lift px-3 py-2">
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Active</option>
          </select>
        </label>
        <Field name="deadlineAt" label="Deadline" type="date" />
        <label className="md:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-mute">What they expect</span>
          <textarea name="deliverables" rows={2} placeholder="3 TikToks, 1 Reel…" className="w-full rounded-xl border border-line bg-lift px-3 py-2" />
        </label>

        <Section title="How they pay" />
        <Field name="basePay" label="Pay per video $" type="number" defaultValue={40} />
        <Field name="monthlyPay" label="Or flat pay for the month $" type="number" defaultValue={0} />
        <Field name="videoCount" label="Videos promised" type="number" defaultValue={3} />
        <Field name="cpm" label="CPM $ per 1,000 views (0 if none)" type="number" defaultValue={0} />

        <Section title="How much you post" />
        <Field name="postsPerDay" label="Posts a day you owe" type="number" defaultValue={5} />
        <Field name="postsPerDayMax" label="Most they allow a day (0 = no cap)" type="number" defaultValue={0} />
        <Field name="accountsAllowed" label="Accounts allowed" type="number" defaultValue={1} />
        <Field name="minutesPerPost" label="Minutes per post" type="number" defaultValue={10} />
        <Field name="monthlyHoursEstimate" label="Your hours a month" type="number" defaultValue={15} />
        <Field name="minViews" label="View minimum they require" type="number" defaultValue={0} />

        <Section title="How they work · for the score" />
        <Field name="managerName" label="Manager" />
        <Field name="approvalHours" label="Hours they take to approve" type="number" defaultValue={12} />
        <Field name="creativeFreedom" label="Creative freedom 1–5" type="number" defaultValue={4} />
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
          <input type="checkbox" name="briefSupply" /> They send daily video ideas
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
