import { clerkMiddleware, clerkClient, type ClerkMiddlewareAuth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { canVisit, homeFor } from "@/lib/access";
import { hasClerk, parseStudioRole } from "@/lib/clerk-mode";
import type { Role } from "@prisma/client";

const OPEN = ["/login", "/sign-in", "/sign-up", "/api/auth"];

function isOpen(pathname: string): boolean {
  return OPEN.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

async function clerkHandler(auth: ClerkMiddlewareAuth, request: NextRequest) {
  if (isOpen(request.nextUrl.pathname)) return NextResponse.next();
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    const signIn = request.nextUrl.clone();
    signIn.pathname = "/sign-in";
    signIn.searchParams.set("redirect_url", request.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }
  let role =
    parseStudioRole((sessionClaims as { metadata?: { role?: unknown } })?.metadata?.role) ||
    parseStudioRole((sessionClaims as { publicMetadata?: { role?: unknown } })?.publicMetadata?.role);
  if (!role) {
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      role = parseStudioRole(clerkUser.publicMetadata.role) || "CREATOR";
    } catch {
      role = "CREATOR";
    }
  }
  if (!canVisit(role, request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }
  return NextResponse.next();
}

export default function middleware(...args: Parameters<typeof clerkMiddleware>) {
  if (hasClerk()) {
    return clerkMiddleware(clerkHandler)(...args);
  }
  return pinGate(args[0]);
}

async function pinGate(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isOpen(pathname) || pathname.startsWith("/_next") || pathname === "/favicon.ico") {
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
    return parseStudioRole(payload.role);
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
