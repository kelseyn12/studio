import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { ensureLocal, mimeFromName } from "@/lib/files";
import { getR2, hasR2 } from "@/lib/r2";
import { readSession } from "@/lib/session";

/** Players (Safari especially) need byte ranges to scrub and even to start. */
function slice(bytes: Buffer, range: string | null) {
  const total = bytes.length;
  const match = range ? /bytes=(\d*)-(\d*)/.exec(range) : null;
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;
  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= total) return null;
  return { start, end, total, body: bytes.subarray(start, end + 1) };
}

export async function GET(
  request: Request,
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
  const mime = mimeFromName(relative);
  const inline = mime.startsWith("video/") || mime.startsWith("image/") || mime.startsWith("audio/");
  try {
    const bytes = hasR2() ? await getR2(relative) : await readFile(await ensureLocal(relative));
    const common = {
      "Content-Type": mime,
      "Accept-Ranges": "bytes",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`,
    };
    const part = slice(Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes), request.headers.get("range"));
    if (part) {
      return new NextResponse(new Uint8Array(part.body), {
        status: 206,
        headers: {
          ...common,
          "Content-Range": `bytes ${part.start}-${part.end}/${part.total}`,
          "Content-Length": String(part.body.length),
        },
      });
    }
    return new NextResponse(new Uint8Array(bytes), { headers: common });
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 404 });
  }
}
