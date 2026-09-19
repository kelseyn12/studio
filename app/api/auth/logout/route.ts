import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function POST() {
  await clearSession();
  return NextResponse.redirect(new URL("/login", process.env.OUTSTAND_REDIRECT_URI || "http://localhost:3000"));
}
