import type { Role } from "@prisma/client";

export function homeFor(role: Role): string {
  if (role === "EDITOR") return "/edits";
  if (role === "OPERATOR") return "/calendar";
  return "/";
}

export function canVisit(role: Role, pathname: string): boolean {
  if (role === "CREATOR") return true;
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/files")) return true;
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up") || pathname === "/login") return true;
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
      { label: "Do", items: [{ href: "/", label: "Today" }, { href: "/calendar", label: "Live" }] },
      {
        label: "Desk",
        items: [
          { href: "/edits", label: "CapCut in" },
          { href: "/library", label: "Library" },
          { href: "/connections", label: "Accounts" },
        ],
      },
    ];
  }
  return [
    {
      label: "Do",
      items: [
        { href: "/", label: "Today" },
        { href: "/plan", label: "Plan month" },
        { href: "/repurposer", label: "Multiply" },
        { href: "/calendar", label: "Live" },
        { href: "/campaigns", label: "Deals" },
        { href: "/analytics", label: "Numbers" },
      ],
    },
    {
      label: "Desk",
      items: [
        { href: "/edits", label: "CapCut in" },
        { href: "/library", label: "Library" },
        { href: "/transcriber", label: "Transcribe" },
        { href: "/dms", label: "DMs" },
        { href: "/connections", label: "Accounts" },
        { href: "/team", label: "Team" },
      ],
    },
  ];
}
