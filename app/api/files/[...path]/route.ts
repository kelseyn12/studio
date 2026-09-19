import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { UPLOAD_ROOT } from "@/lib/files";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await context.params;
  const relative = parts.join("/");
  const absolute = path.join(UPLOAD_ROOT, relative);
  if (!absolute.startsWith(UPLOAD_ROOT)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  try {
    const bytes = await readFile(absolute);
    return new NextResponse(bytes, {
      headers: { "Content-Type": "application/octet-stream" },
    });
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 404 });
  }
}
