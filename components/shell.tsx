import { Nav } from "@/components/nav";
import { SignOutControl } from "@/components/sign-out";
import { requireUser } from "@/lib/auth";
import { hasClerk } from "@/lib/clerk-mode";

export async function Shell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen">
      <Nav role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-8 py-4">
          <p className="text-sm text-mute">
            {user.role === "EDITOR"
              ? "Your jobs are in this app. Drop the finished video here when it is done."
              : "One next action. Then you can close the laptop."}
          </p>
          <SignOutControl name={user.name} role={user.role} clerk={hasClerk()} />
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
