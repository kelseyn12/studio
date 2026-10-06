import { pickStudioUser } from "@/lib/clerk-match";
import { prisma } from "@/lib/prisma";
import { hasClerk, parseStudioRole } from "@/lib/clerk-mode";
import type { SessionUser } from "@/lib/session";

const SESSION_HOLD_MS = 60_000;
const held = new Map<string, { user: SessionUser; at: number }>();

export async function readClerkSession(): Promise<SessionUser | null> {
  if (!hasClerk()) return null;
  const { auth, currentUser, clerkClient } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) return null;
  const cached = held.get(userId);
  if (cached && Date.now() - cached.at < SESSION_HOLD_MS) return cached.user;
  const clerk = await currentUser();
  const email = clerk?.primaryEmailAddress?.emailAddress || clerk?.emailAddresses[0]?.emailAddress;
  if (!email) return null;
  const metaRole = parseStudioRole(clerk?.publicMetadata?.role);
  const folded = email.toLowerCase();
  const people = await prisma.user.findMany();
  let user = pickStudioUser(people, userId, folded);
  const seenAt = new Date();
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: folded,
        name: clerk?.firstName || clerk?.fullName || folded,
        role: metaRole || "CREATOR",
        lastSeenAt: seenAt,
      },
    });
  } else {
    const emailTaken = people.some((person) => person.id !== user!.id && person.email.toLowerCase() === folded);
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastSeenAt: seenAt,
        ...(emailTaken ? {} : { email: folded }),
        ...(user.clerkId !== userId ? { clerkId: userId } : {}),
      },
    });
  }
  if (metaRole && metaRole !== user.role) {
    user = await prisma.user.update({ where: { id: user.id }, data: { role: metaRole } });
  }
  if (!metaRole && user.role) {
    try {
      const client = await clerkClient();
      await client.users.updateUser(userId, { publicMetadata: { role: user.role } });
    } catch {
      /* JWT still works after the next sign-in */
    }
  }
  const session = { id: user.id, name: user.name, email: user.email, role: user.role };
  held.set(userId, { user: session, at: Date.now() });
  return session;
}
