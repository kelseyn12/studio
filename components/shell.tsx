import { Nav } from "@/components/nav";
import { requireUser } from "@/lib/auth";

export async function Shell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen">
      <Nav />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-8 py-4">
          <p className="text-sm text-mute">One next action. Then you can close the laptop.</p>
          <p className="text-sm text-paper">
            {user.name} · {user.role.toLowerCase()}
          </p>
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
