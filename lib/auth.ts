import { createHash, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { readSession, type SessionUser } from "@/lib/session";
import { hasClerk } from "@/lib/clerk-mode";
import { redirect } from "next/navigation";

export function hashPin(pin: string): string {
  return createHash("sha256").update(`studio:${pin}`).digest("hex");
}

export function pinsMatch(input: string, expected: string): boolean {
  const left = Buffer.from(hashPin(input));
  const right = Buffer.from(hashPin(expected));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function studioPin(): string {
  return process.env.STUDIO_PIN || "4242";
}

export async function requireUser(): Promise<SessionUser> {
  const user = await readSession();
  if (!user) redirect(hasClerk() ? "/sign-in" : "/login");
  return user;
}

export async function ensureOwner(name: string, email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      name,
      email,
      role: "CREATOR",
      pinHash: hashPin(studioPin()),
    },
  });
}
