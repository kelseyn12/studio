import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { canVisit, homeFor } from "@/lib/access";
import type { Role } from "@prisma/client";

const OPEN = ["/login", "/api/auth/login", "/api/files"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (OPEN.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }
  const token = request.cookies.get("studio_session")?.value;
  if (!token) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  const role = await roleFromToken(token);
  if (role && !canVisit(role, pathname)) {
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }
  return NextResponse.next();
}

async function roleFromToken(token: string): Promise<Role | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const role = String(payload.role || "");
    if (role === "EDITOR" || role === "OPERATOR" || role === "CREATOR") return role;
    return null;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
