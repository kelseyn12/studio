import { addLink, deleteLink } from "@/app/dms/actions";

const PUBLIC_BASE = process.env.APP_URL || "https://system-studio.fly.dev";

export function TrackedLinks({
  links,
}: {
  links: Array<{ id: string; slug: string; targetUrl: string; label: string; clicks: number }>;
}) {
  return (
    <section className="mb-8 max-w-2xl">
      <h2 className="mb-1 text-lg font-semibold">Tracked links</h2>
      <p className="mb-4 text-sm text-mute">
        Put these in your auto-DMs instead of the raw link. Every click counts here, so you know which video actually
        sends people — no matter what tool sends the DM.
      </p>
      <form action={addLink} className="mb-4 grid gap-3 rounded-card border border-line bg-panel p-5">
        <input name="label" placeholder="What this is — Casper deal link, kit page…" className="field" />
        <input name="targetUrl" type="url" placeholder="https:// where the click should land" className="field" required />
        <input name="slug" placeholder="Optional short word — casper (blank = random)" className="field" />
        <button className="rounded-xl bg-sun px-4 py-3 font-semibold text-ink">Make tracked link</button>
      </form>
      <div className="space-y-2">
        {links.length === 0 ? (
          <p className="text-sm text-mute">No tracked links yet.</p>
        ) : (
          links.map((link) => (
            <div
              key={link.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-panel px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {PUBLIC_BASE}/l/{link.slug}
                </p>
                <p className="truncate text-xs text-mute">
                  {link.label ? `${link.label} · ` : ""}
                  {link.targetUrl}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{link.clicks} click{link.clicks === 1 ? "" : "s"}</span>
                <form action={deleteLink}>
                  <input type="hidden" name="id" value={link.id} />
                  <button className="rounded-lg border border-line px-2 py-1 text-xs text-mute">Delete</button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
