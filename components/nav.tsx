"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { navFor } from "@/lib/access";

export function Nav({ role }: { role: Role }) {
  const pathname = usePathname();
  const groups = navFor(role);
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-panel px-4 py-6">
      <Link href={role === "EDITOR" ? "/edits" : "/"} className="mb-8 px-2 text-lg font-semibold tracking-tight">
        System Studio
      </Link>
      <nav className="flex flex-1 flex-col gap-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block rounded-lg px-2 py-2 text-sm ${
                        active ? "bg-lift text-paper" : "text-mute hover:bg-lift hover:text-paper"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
