import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { ensureLocal, mimeFromName } from "@/lib/files";
import { getR2, hasR2 } from "@/lib/r2";
import { readSession } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const { path: parts } = await context.params;
  const relative = parts.join("/");
  if (!relative || relative.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const name = relative.split("/").pop() || "file";
  try {
    const bytes = hasR2() ? await getR2(relative) : await readFile(await ensureLocal(relative));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mimeFromName(relative),
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 404 });
  }
}
