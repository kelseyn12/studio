import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

async function addMember(formData: FormData) {
  "use server";
  await prisma.user.create({
    data: {
      name: String(formData.get("name") || "Member"),
      email: String(formData.get("email") || `${Date.now()}@studio.local`),
      role: (formData.get("role") as Role) || "EDITOR",
    },
  });
  redirect("/team");
}

export default async function TeamPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Team</h1>
      <p className="mt-1 mb-6 text-mute">Creator films. Editor cuts. Operator schedules.</p>
      <form action={addMember} className="mb-8 flex flex-wrap gap-2">
        <input name="name" placeholder="Name" className="rounded-xl border border-line bg-lift px-3 py-2" />
        <input name="email" placeholder="Email" className="rounded-xl border border-line bg-lift px-3 py-2" />
        <select name="role" className="rounded-xl border border-line bg-lift px-3 py-2">
          <option value="EDITOR">Editor</option>
          <option value="OPERATOR">Operator</option>
          <option value="CREATOR">Creator</option>
        </select>
        <button className="rounded-xl bg-sun px-4 py-2 font-semibold text-ink">Add</button>
      </form>
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-2xl border border-line bg-panel px-5 py-4">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-mute">{user.email}</p>
            </div>
            <p className="text-sm capitalize text-mute">{user.role.toLowerCase()}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}
