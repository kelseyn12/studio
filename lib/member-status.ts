import { labelDay } from "@/lib/dates";

/** Team row: a real person who has not opened Studio, or the day they last did. */
export function memberStatus(user: {
  email: string;
  clerkId: string | null;
  lastSeenAt: Date | null;
}): string {
  if (user.email.endsWith("@studio.local")) return "";
  if (!user.clerkId) return "Has not signed in";
  if (!user.lastSeenAt) return "Signed in";
  return `Signed in · ${labelDay(user.lastSeenAt)}`;
}
