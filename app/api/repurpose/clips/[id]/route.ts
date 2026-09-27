import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deleteUpload } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const { id } = await context.params;
  const body = (await request.json()) as { hookText?: unknown; postCaption?: unknown; hookLayout?: unknown; captionsJson?: unknown };
  const clip = await prisma.repurposeClip.update({
    where: { id },
    data: {
      ...(body.hookText !== undefined ? { hookText: String(body.hookText || "") } : {}),
      ...(body.postCaption !== undefined ? { postCaption: String(body.postCaption || "") } : {}),
      ...(body.hookLayout !== undefined ? { hookLayout: String(body.hookLayout || "") } : {}),
      ...(body.captionsJson !== undefined ? { captionsJson: String(body.captionsJson || "") } : {}),
    },
  });
  revalidatePath(`/repurposer/${clip.batchId}`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const { id } = await context.params;
  const clip = await prisma.repurposeClip.findUnique({ where: { id } });
  if (!clip) return NextResponse.json({ ok: true });
  await prisma.repurposeClip.delete({ where: { id } });
  await deleteUpload(clip.path);
  if (clip.thumbPath) await deleteUpload(clip.thumbPath);
  revalidatePath(`/repurposer/${clip.batchId}`);
  return NextResponse.json({ ok: true });
}
