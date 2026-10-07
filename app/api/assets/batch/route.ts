import { NextResponse } from "next/server";
import { attachEditedFile } from "@/lib/cut-ready";
import { matchDropToCard } from "@/lib/editor-batches";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readSession } from "@/lib/session";
import { rejectStudioFile } from "@/lib/storage";

export const maxDuration = 60;

const NAME_HELP = "Name the file with its mix number, like “mix 2.mp4”.";

/**
 * One finished file for a whole batch folder. The mix number in the file name picks the video,
 * IG/TT in the name picks the look. Editors may only drop onto their own jobs.
 */
export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "assets-batch"), 30)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const cardIds = String(form.get("cardIds") || "").split(",").map((id) => id.trim()).filter(Boolean);
  if (!(file instanceof File) || cardIds.length === 0) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  const blocked = rejectStudioFile(file.size, "EDITED");
  if (blocked) return NextResponse.json({ error: blocked }, { status: 400 });
  const cards = await prisma.card.findMany({
    where: { id: { in: cardIds }, ...(user.role === "EDITOR" ? { editorId: user.id } : {}) },
    select: { id: true, title: true },
  });
  const match = matchDropToCard(file.name, cards);
  if (!match) return NextResponse.json({ error: `${file.name}: ${NAME_HELP}` }, { status: 400 });
  await attachEditedFile(match.card.id, file, match.textStyle, user.role);
  return NextResponse.json({ ok: true, cardId: match.card.id, textStyle: match.textStyle });
}
