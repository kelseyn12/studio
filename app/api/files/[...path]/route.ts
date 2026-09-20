import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { ensureLocal, mimeFromName, UPLOAD_ROOT } from "@/lib/files";
import { readSession } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const { path: parts } = await context.params;
  const relative = parts.join("/");
  const root = path.resolve(UPLOAD_ROOT);
  const absolute = path.resolve(root, relative);
  if (!absolute.startsWith(root)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  try {
    const local = await ensureLocal(relative);
    const bytes = await readFile(local);
    const name = path.basename(relative);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": mimeFromName(relative),
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 404 });
  }
}
