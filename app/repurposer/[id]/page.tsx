import { notFound, redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { saveUpload } from "@/lib/files";
import { prisma } from "@/lib/prisma";

async function addClip(formData: FormData) {
  "use server";
  const batchId = String(formData.get("batchId"));
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;
  const saved = await saveUpload(file, `repurpose/${batchId}`);
  await prisma.repurposeClip.create({
    data: {
      batchId,
      slot: (formData.get("slot") as "HOOK" | "DEMO" | "CTA") || "HOOK",
      path: saved.path,
      filename: saved.filename,
    },
  });
  redirect(`/repurposer/${batchId}`);
}

export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batch = await prisma.repurposeBatch.findUnique({
    where: { id },
    include: { clips: true, outputs: true },
  });
  if (!batch) notFound();
  const hooks = batch.clips.filter((clip) => clip.slot === "HOOK");
  const demos = batch.clips.filter((clip) => clip.slot === "DEMO");
  const ctas = batch.clips.filter((clip) => clip.slot === "CTA");
  const possible = Math.max(hooks.length, 1) * Math.max(demos.length, 1) * Math.max(ctas.length, 1);

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">{batch.name}</h1>
      <p className="mt-1 mb-6 text-mute">
        {hooks.length} × {demos.length} × {ctas.length} = {possible} unique videos possible.
      </p>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {(["HOOK", "DEMO", "CTA"] as const).map((slot) => (
          <form key={slot} action={addClip} className="rounded-2xl border border-line bg-panel p-4">
            <input type="hidden" name="batchId" value={batch.id} />
            <input type="hidden" name="slot" value={slot} />
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-mute">{slot}</p>
            <input name="file" type="file" accept="video/*" className="mb-2 w-full text-sm" />
            <button className="rounded-lg bg-sun px-3 py-1.5 text-sm font-semibold text-ink">Add clip</button>
            <ul className="mt-3 space-y-1 text-sm text-mute">
              {batch.clips
                .filter((clip) => clip.slot === slot)
                .map((clip) => (
                  <li key={clip.id}>{clip.filename}</li>
                ))}
            </ul>
          </form>
        ))}
      </div>
      <form action={`/api/repurpose/${batch.id}/generate`} method="post">
        <button className="rounded-xl bg-sun px-5 py-3 font-semibold text-ink">Generate videos</button>
      </form>
      <ul className="mt-6 space-y-2">
        {batch.outputs.map((output) => (
          <li key={output.id}>
            <a className="text-sun" href={`/api/files/${output.path}`}>
              {output.label}
            </a>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
