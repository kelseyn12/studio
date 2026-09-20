import { NextResponse } from "next/server";
import { rewriteHook } from "@/lib/rewrite";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readSession } from "@/lib/session";

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "rewrite"), 20)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const body = await request.json();
  try {
    const hook = await rewriteHook({
      hook: String(body.hook || ""),
      premise: String(body.premise || ""),
      script: String(body.script || ""),
    });
    return NextResponse.json({ hook });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Rewrite failed" }, { status: 400 });
  }
}
