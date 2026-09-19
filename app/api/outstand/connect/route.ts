import { NextResponse } from "next/server";
import { connectUrl, hasOutstand } from "@/lib/outstand";
import { readSession } from "@/lib/session";

export async function GET(request: Request) {
  const user = await readSession();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  if (!hasOutstand()) {
    return NextResponse.json({ error: "Outstand is not configured" }, { status: 400 });
  }
  const network = new URL(request.url).searchParams.get("network") || "instagram";
  const redirectUri = process.env.OUTSTAND_REDIRECT_URI || `${new URL(request.url).origin}/connections/callback`;
  return NextResponse.redirect(connectUrl(network, redirectUri));
}
