export function hasClerk(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

export function parseStudioRole(value: unknown): "CREATOR" | "EDITOR" | "OPERATOR" | null {
  const role = String(value || "");
  if (role === "CREATOR" || role === "EDITOR" || role === "OPERATOR") return role;
  return null;
}
