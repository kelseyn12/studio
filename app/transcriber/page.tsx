import { Shell } from "@/components/shell";
import { prisma } from "@/lib/prisma";

export default async function TranscriberPage() {
  const transcripts = await prisma.transcript.findMany({ orderBy: { createdAt: "desc" }, take: 20 });

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Transcribe</h1>
      <p className="mt-2 mb-6 max-w-2xl text-mute">
        Talk faster than you type. Drop the voice note or the reference video, get text, paste it into a card script.
      </p>
      <form
        action="/api/transcribe"
        method="post"
        encType="multipart/form-data"
        className="mb-8 max-w-2xl space-y-3 rounded-card border border-line bg-panel p-5"
      >
        <input name="title" placeholder="Title" className="field" />
        <input name="sourceUrl" placeholder="Optional link to remember" className="field" />
        <input name="file" type="file" accept="audio/*,video/*" className="text-sm" />
        <button className="rounded-xl bg-sun px-4 py-2 font-semibold text-ink">Transcribe</button>
        <p className="text-xs text-mute">Needs OPENAI_API_KEY in .env. A link alone is saved as a reminder, not downloaded.</p>
      </form>
      <div className="space-y-3">
        {transcripts.map((item) => (
          <article key={item.id} className="rounded-card border border-line bg-panel p-5">
            <h2 className="font-semibold">{item.title}</h2>
            {item.sourceUrl ? <p className="mt-1 text-xs text-mute">{item.sourceUrl}</p> : null}
            <p className="mt-2 whitespace-pre-wrap text-sm text-mute">{item.text}</p>
          </article>
        ))}
      </div>
    </Shell>
  );
}
