import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPin, pinsMatch, studioPin } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { writeSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  pin: z.string().min(3),
  role: z.enum(["CREATOR", "EDITOR", "OPERATOR"]).default("CREATOR"),
});

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "login"), 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid login" }, { status: 400 });
  }
  if (!pinsMatch(parsed.data.pin, studioPin())) {
    return NextResponse.json({ error: "Wrong studio PIN" }, { status: 401 });
  }
  const user =
    (await prisma.user.findUnique({ where: { email: parsed.data.email } })) ??
    (await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        pinHash: hashPin(studioPin()),
      },
    }));
  await writeSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  return NextResponse.json({ ok: true });
}
