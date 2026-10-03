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
  let user = await prisma.user.findFirst({
    where: { OR: [{ clerkId: userId }, { email }] },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        name: clerk?.firstName || clerk?.fullName || email,
        role: metaRole || "CREATOR",
      },
    });
  } else if (user.clerkId !== userId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { clerkId: userId },
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
