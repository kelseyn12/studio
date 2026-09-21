import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { TrackedLinks } from "@/components/tracked-links";
import { hasManychat, sendManychatText } from "@/lib/manychat";
import { prisma } from "@/lib/prisma";

async function addRecipe(formData: FormData) {
  "use server";
  await prisma.dmRecipe.create({
    data: {
      trigger: String(formData.get("trigger") || ""),
      message: String(formData.get("message") || ""),
      channel: String(formData.get("channel") || "instagram"),
    },
  });
  redirect("/dms");
}

async function sendTest(formData: FormData) {
  "use server";
  const subscriberId = String(formData.get("subscriberId") || "");
  const message = String(formData.get("message") || "");
  const channel = (String(formData.get("channel") || "instagram") as "instagram" | "whatsapp" | "messenger");
  try {
    if (subscriberId && message) {
      await sendManychatText({ subscriberId, text: message, channel });
    }
  } catch {
    /* test send should not crash the page */
  }
  redirect("/dms");
}

export default async function DmsPage() {
  const [recipes, links] = await Promise.all([
    prisma.dmRecipe.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.shortLink.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">DMs</h1>
      <p className="mt-2 mb-6 max-w-2xl text-mute">
        Do not sit in comments typing the same reply. Save the recipe here, then turn the same keyword on in ManyChat so Instagram actually sends it.
      </p>
      <div className="mb-6 flex flex-wrap gap-2">
        <a
          href="https://app.manychat.com/"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-sun px-4 py-2 text-sm font-semibold text-ink"
        >
          Open ManyChat
        </a>
      </div>
      {hasManychat() ? (
        <p className="mb-6 text-sm text-sun">ManyChat key is on.</p>
      ) : (
        <p className="mb-6 rounded-card border border-line bg-panel px-4 py-3 text-sm">
          ManyChat Free is 25 contacts and a handful of automations — not enough for comment DMs at volume. Paid starts when you
          outgrow that. Add <code>MANYCHAT_API_KEY</code> to <code>.env</code>. Optional: <code>MANYCHAT_EDITOR_ID</code> and{" "}
          <code>MANYCHAT_CREATOR_ID</code> so Send to editor / Live also pings you.
        </p>
      )}
      <TrackedLinks links={links} />
      <form action={addRecipe} className="mb-8 grid max-w-2xl gap-3 rounded-card border border-line bg-panel p-5">
        <p className="font-semibold">Comment recipe</p>
        <input name="trigger" placeholder="Keyword they comment — LINK, DEAL, KIT" className="field" required />
        <textarea name="message" placeholder="Auto DM copy" className="field min-h-24" required />
        <select name="channel" className="field" defaultValue="instagram">
          <option value="instagram">Instagram</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="messenger">Messenger</option>
        </select>
        <button className="rounded-xl bg-sun px-4 py-3 font-semibold text-ink">Save recipe</button>
      </form>
      <div className="mb-8 space-y-3">
        {recipes.length === 0 ? (
          <p className="text-sm text-mute">No recipes yet. Put the same keyword into a ManyChat comment trigger.</p>
        ) : (
          recipes.map((recipe) => (
            <article key={recipe.id} className="rounded-card border border-line bg-panel p-4">
              <p className="text-xs uppercase text-mute">
                Comment “{recipe.trigger}” · {recipe.channel}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{recipe.message}</p>
            </article>
          ))
        )}
      </div>
      {hasManychat() ? (
        <form action={sendTest} className="grid max-w-2xl gap-3 rounded-card border border-line bg-panel p-5">
          <p className="font-semibold">Send a test</p>
          <input name="subscriberId" placeholder="ManyChat subscriber ID" className="field" required />
          <textarea name="message" placeholder="Message" className="field min-h-20" required />
          <select name="channel" className="field" defaultValue="instagram">
            <option value="instagram">Instagram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="messenger">Messenger</option>
          </select>
          <button className="rounded-xl border border-line px-4 py-3">Send</button>
        </form>
      ) : null}
    </Shell>
  );
}
