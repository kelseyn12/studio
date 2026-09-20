"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS = [
  {
    label: "Now",
    items: [
      { href: "/", label: "Today" },
      { href: "/pipeline", label: "Pipeline" },
    ],
  },
  {
    label: "Make",
    items: [
      { href: "/plan", label: "Plan" },
      { href: "/repurposer", label: "Repurpose" },
      { href: "/transcriber", label: "Transcribe" },
    ],
  },
  {
    label: "Ship",
    items: [
      { href: "/edits", label: "CapCut in" },
      { href: "/library", label: "Library" },
      { href: "/calendar", label: "Calendar" },
      { href: "/connections", label: "Accounts" },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/campaigns", label: "Deals" },
      { href: "/analytics", label: "Numbers" },
      { href: "/team", label: "Team" },
    ],
  },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-panel px-4 py-6">
      <Link href="/" className="mb-8 px-2 text-lg font-semibold tracking-tight">
        System Studio
      </Link>
      <nav className="flex flex-1 flex-col gap-6">
        {GROUPS.map((group) => (
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
      <Link
        href="/repurposer"
        className="mt-6 rounded-xl bg-sun px-3 py-3 text-center text-sm font-semibold text-ink"
      >
        New batch
      </Link>
    </aside>
  );
}
