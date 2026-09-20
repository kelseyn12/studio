import type { Role } from "@prisma/client";

export function homeFor(role: Role): string {
  if (role === "EDITOR") return "/edits";
  if (role === "OPERATOR") return "/calendar";
  return "/";
}

export function canVisit(role: Role, pathname: string): boolean {
  if (role === "CREATOR") return true;
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/files")) return true;
  if (role === "EDITOR") {
    if (pathname === "/edits" || pathname.startsWith("/edits/")) return true;
    if (pathname.startsWith("/api/assets")) return true;
    if (/^\/cards\/[^/]+$/.test(pathname) && !pathname.endsWith("/new")) return true;
    return false;
  }
  const operator = ["/", "/calendar", "/pipeline", "/library", "/connections", "/edits", "/cards"];
  if (operator.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return true;
  if (pathname.startsWith("/api/calendar") || pathname.startsWith("/api/outstand") || pathname.startsWith("/api/assets")) {
    return true;
  }
  return false;
}

export function navFor(role: Role): Array<{ label: string; items: Array<{ href: string; label: string }> }> {
  if (role === "EDITOR") {
    return [{ label: "Your work", items: [{ href: "/edits", label: "CapCut in" }] }];
  }
  if (role === "OPERATOR") {
    return [
      { label: "Now", items: [{ href: "/", label: "Today" }, { href: "/pipeline", label: "Pipeline" }] },
      {
        label: "Ship",
        items: [
          { href: "/edits", label: "CapCut in" },
          { href: "/library", label: "Library" },
          { href: "/calendar", label: "Calendar" },
          { href: "/connections", label: "Accounts" },
        ],
      },
    ];
  }
  return [
    { label: "Now", items: [{ href: "/", label: "Today" }, { href: "/pipeline", label: "Pipeline" }] },
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
}
