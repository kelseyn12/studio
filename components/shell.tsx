import { Nav } from "@/components/nav";
import { requireUser } from "@/lib/auth";

export async function Shell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen">
      <Nav role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-8 py-4">
          <p className="text-sm text-mute">
            {user.role === "EDITOR"
              ? "Your cards. Open the folder. Drop the 1080 export."
              : "One next action. Then you can close the laptop."}
          </p>
          <form action="/api/auth/logout" method="post" className="flex items-center gap-3">
            <p className="text-sm text-paper">
              {user.name} · {user.role.toLowerCase()}
            </p>
            <button className="text-sm text-mute">Switch person</button>
          </form>
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
