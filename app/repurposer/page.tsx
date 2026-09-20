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
          Not a timeline editor. You already filmed the parts. You sort them. Studio multiplies them.
        </p>
        <ol className="mt-4 space-y-1 text-sm text-mute">
          <li>1. Drop openings into Hooks, middles into Bodies, endings into CTAs. The row is the label.</li>
          <li>2. Mix settings on the batch page stitch every combo, then make unique copies.</li>
          <li>3. ffmpeg does this on this machine. No CapCut API. Outstand is only for posting later.</li>
        </ol>
      </div>
      <form action={createBatch} className="mb-8 flex max-w-xl gap-2">
        <input name="name" placeholder="Batch name — e.g. OpenArt week 3" className="field" />
        <button className="shrink-0 rounded-xl bg-sun px-5 py-2 font-semibold text-ink">New batch</button>
      </form>
      <div className="space-y-2">
        {batches.length === 0 ? (
          <p className="rounded-card border border-dashed border-line px-5 py-10 text-mute">
            Start a batch. One sitting of clips can cover the week.
          </p>
        ) : (
          batches.map((batch) => {
            const hooks = batch.clips.filter((clip) => clip.slot === "HOOK").length;
            const bodies = batch.clips.filter((clip) => clip.slot === "DEMO").length;
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
                    {hooks} hooks · {bodies} bodies · {ctas} CTAs · {batch.outputs.length} videos out
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
