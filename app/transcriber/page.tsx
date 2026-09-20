import { Shell } from "@/components/shell";
import { hasOpenAI } from "@/lib/whisper";
import { prisma } from "@/lib/prisma";

export default async function TranscriberPage() {
  const transcripts = await prisma.transcript.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  const ready = hasOpenAI();

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Transcribe</h1>
      <p className="mt-2 mb-6 max-w-2xl text-mute">
        Voice is faster than typing. Whisper turns a voice note or a reference clip into text so the brief is not stuck in WhatsApp.
        Record on the card and it writes the editor note. Use this page for competitor videos and leftover audio.
      </p>
      {ready ? null : (
        <p className="mb-6 rounded-card border border-line bg-panel px-4 py-3 text-sm">
          Add <code>OPENAI_API_KEY</code> to <code>.env</code> and restart. Then drop a file.
        </p>
      )}
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
