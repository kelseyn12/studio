import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const { id } = await context.params;
  const body = (await request.json()) as { hookText?: unknown; postCaption?: unknown };
  await prisma.repurposeClip.update({
    where: { id },
    data: {
      ...(body.hookText !== undefined ? { hookText: String(body.hookText || "") } : {}),
      ...(body.postCaption !== undefined ? { postCaption: String(body.postCaption || "") } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  const { id } = await context.params;
  await prisma.repurposeClip.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
