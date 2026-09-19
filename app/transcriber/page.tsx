import { Shell } from "@/components/shell";
import { prisma } from "@/lib/prisma";

export default async function TranscriberPage() {
  const transcripts = await prisma.transcript.findMany({ orderBy: { createdAt: "desc" }, take: 20 });

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Transcriber</h1>
      <p className="mt-1 mb-6 text-mute">Voice is faster for the creator. Structure is clearer for the editor.</p>
      <form action="/api/transcribe" method="post" encType="multipart/form-data" className="mb-8 max-w-2xl space-y-3 rounded-2xl border border-line bg-panel p-5">
        <input name="title" placeholder="Title" className="w-full rounded-xl border border-line bg-lift px-3 py-2" />
        <input name="sourceUrl" placeholder="https://tiktok.com/@user/video/..." className="w-full rounded-xl border border-line bg-lift px-3 py-2" />
        <input name="file" type="file" accept="audio/*,video/*" className="w-full text-sm" />
        <button className="rounded-xl bg-sun px-4 py-2 font-semibold text-ink">Transcribe</button>
        <p className="text-xs text-mute">Needs OPENAI_API_KEY for Whisper. A URL-only job stores the link for later.</p>
      </form>
      <div className="space-y-3">
        {transcripts.map((item) => (
          <article key={item.id} className="rounded-2xl border border-line bg-panel p-5">
            <h2 className="font-semibold">{item.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-mute">{item.text}</p>
          </article>
        ))}
      </div>
    </Shell>
  );
}
