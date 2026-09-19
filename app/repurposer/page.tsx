import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { prisma } from "@/lib/prisma";

async function createBatch(formData: FormData) {
  "use server";
  const batch = await prisma.repurposeBatch.create({
    data: {
      name: String(formData.get("name") || "Untitled batch"),
      count: Number(formData.get("count") || 1),
      speedOn: formData.get("speedOn") === "on",
      colorOn: formData.get("colorOn") === "on",
      zoomOn: formData.get("zoomOn") === "on",
      intensity: String(formData.get("intensity") || "light"),
    },
  });
  redirect(`/repurposer/${batch.id}`);
}

export default async function RepurposerPage() {
  const batches = await prisma.repurposeBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: { clips: true, outputs: true },
  });

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Repurposer</h1>
      <p className="mt-1 mb-6 text-mute">Hooks together. Demos together. CTAs together. Then assemble the variations.</p>
      <form action={createBatch} className="mb-8 grid max-w-xl gap-3 rounded-2xl border border-line bg-panel p-5">
        <input name="name" placeholder="Batch name" className="rounded-xl border border-line bg-lift px-3 py-2" />
        <input name="count" type="number" defaultValue={6} className="rounded-xl border border-line bg-lift px-3 py-2" />
        <label className="text-sm"><input type="checkbox" name="speedOn" defaultChecked className="mr-2" />Speed variation</label>
        <label className="text-sm"><input type="checkbox" name="colorOn" className="mr-2" />Color variation</label>
        <label className="text-sm"><input type="checkbox" name="zoomOn" className="mr-2" />Zoom / crop jitter</label>
        <select name="intensity" className="rounded-xl border border-line bg-lift px-3 py-2">
          <option value="light">Light</option>
          <option value="hard">Hard</option>
        </select>
        <button className="rounded-xl bg-sun px-4 py-2 font-semibold text-ink">New batch</button>
      </form>
      <div className="space-y-2">
        {batches.map((batch) => (
          <Link key={batch.id} href={`/repurposer/${batch.id}`} className="flex items-center justify-between rounded-2xl border border-line bg-panel px-5 py-4">
            <div>
              <p className="font-medium">{batch.name}</p>
              <p className="text-sm text-mute">
                {batch.clips.length} clips · {batch.outputs.length} outputs
              </p>
            </div>
            <span className="text-sm capitalize text-mute">{batch.status}</span>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
