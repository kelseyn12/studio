/** The Studio person for this Clerk login. Email match ignores capitals. The invite row wins over a later duplicate. */
export function pickStudioUser<T extends { email: string; clerkId: string | null; createdAt: Date }>(
  people: T[],
  clerkId: string,
  email: string,
): T | null {
  const linked = people.find((person) => person.clerkId === clerkId);
  if (linked) return linked;
  const folded = email.toLowerCase();
  const sameEmail = people
    .filter((person) => person.email.toLowerCase() === folded)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return sameEmail[0] ?? null;
}
