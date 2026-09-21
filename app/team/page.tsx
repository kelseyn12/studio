import { redirect } from "next/navigation";
import { RemoveMemberButton } from "@/components/remove-member";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { hasClerk } from "@/lib/clerk-mode";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

async function addMember(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "Member");
  const email = String(formData.get("email") || `${Date.now()}@studio.local`);
  const role = (formData.get("role") as Role) || "EDITOR";
  await prisma.user.create({
    data: { name, email, role },
  });
  if (hasClerk() && email.includes("@") && !email.endsWith("@studio.local")) {
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      await client.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: { role },
        ignoreExisting: true,
      });
    } catch {
      /* Prisma user still exists; they can sign up with that email */
    }
  }
  redirect("/team");
}

async function setDefaultEditor(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await prisma.user.updateMany({ data: { defaultEditor: false } });
  await prisma.user.update({ where: { id }, data: { defaultEditor: true } });
  redirect("/team");
}

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [users, me, query] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    requireUser(),
    searchParams,
  ]);
  const clerk = hasClerk();
  const errorText =
    query.error === "self"
      ? "You cannot remove yourself."
      : query.error === "last-creator"
        ? "Studio needs at least one creator. Add another creator first."
        : "";
  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Team</h1>
      <p className="mt-1 mb-6 max-w-2xl text-mute">
        {clerk
          ? "Invite sends an email. They open Cuts on their computer. Mark one editor as default for Send."
          : "Add an editor here. PIN is this laptop only. A remote editor needs Clerk on the public site."}
      </p>
      <form action={addMember} className="mb-8 flex flex-wrap gap-2">
        <input name="name" placeholder="Name" className="rounded-xl border border-line bg-lift px-3 py-2" />
        <input name="email" placeholder="Email" className="rounded-xl border border-line bg-lift px-3 py-2" />
        <select name="role" className="rounded-xl border border-line bg-lift px-3 py-2">
          <option value="EDITOR">Editor</option>
          <option value="OPERATOR">Operator</option>
          <option value="CREATOR">Creator</option>
        </select>
        <button className="rounded-xl bg-sun px-4 py-2 font-semibold text-ink">{clerk ? "Invite" : "Add"}</button>
      </form>
      {errorText ? <p className="mb-4 text-sm text-review">{errorText}</p> : null}
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-2xl border border-line bg-panel px-5 py-4">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-mute">{user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm capitalize text-mute">{user.role.toLowerCase()}</p>
              {user.role === "EDITOR" ? (
                user.defaultEditor ? (
                  <p className="text-sm text-sun">Default</p>
                ) : (
                  <form action={setDefaultEditor}>
                    <input type="hidden" name="id" value={user.id} />
                    <button className="text-sm text-mute">Make default</button>
                  </form>
                )
              ) : null}
              {user.id !== me.id ? <RemoveMemberButton id={user.id} name={user.name} /> : null}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
