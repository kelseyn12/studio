import Link from "next/link";
import { Shell } from "@/components/shell";
import { prisma } from "@/lib/prisma";
import { createBatch } from "./actions";

export default async function RepurposerPage() {
  const batches = await prisma.repurposeBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: { clips: true, outputs: true },
  });

  return (
    <Shell>
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Repurpose</h1>
        <p className="mt-2 text-mute">
          Film hooks together, demos together, CTAs together. Studio multiplies them into unique videos —
          small speed and color changes so each one can stand alone.
        </p>
      </div>
      <form action={createBatch} className="mb-8 flex max-w-xl gap-2">
        <input name="name" placeholder="Batch name — e.g. OpenArt week 3" className="field" />
        <button className="shrink-0 rounded-xl bg-sun px-5 py-2 font-semibold text-ink">New batch</button>
      </form>
      <div className="space-y-2">
        {batches.length === 0 ? (
          <p className="rounded-card border border-dashed border-line px-5 py-10 text-mute">
            No batches yet. One sitting of clips can cover the whole week.
          </p>
        ) : (
          batches.map((batch) => {
            const hooks = batch.clips.filter((clip) => clip.slot === "HOOK").length;
            const demos = batch.clips.filter((clip) => clip.slot === "DEMO").length;
            const ctas = batch.clips.filter((clip) => clip.slot === "CTA").length;
            return (
              <Link
                key={batch.id}
                href={`/repurposer/${batch.id}`}
                className="flex items-center justify-between rounded-card border border-line bg-panel px-5 py-4"
              >
                <div>
                  <p className="font-medium">{batch.name}</p>
                  <p className="text-sm text-mute">
                    {hooks} × {demos} × {ctas} clips · {batch.outputs.length} videos
                  </p>
                </div>
                <span className="text-sm capitalize text-mute">{batch.status}</span>
              </Link>
            );
          })
        )}
      </div>
    </Shell>
  );
}
