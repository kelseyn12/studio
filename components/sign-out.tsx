"use client";

import { SignOutButton } from "@clerk/nextjs";

export function SignOutControl({
  name,
  role,
  clerk,
}: {
  name: string;
  role: string;
  clerk: boolean;
}) {
  const label = (
    <p className="text-sm text-paper">
      {name} · {role.toLowerCase()}
    </p>
  );
  if (clerk) {
    return (
      <div className="flex items-center gap-3">
        {label}
        <SignOutButton>
          <button className="text-sm text-mute">Sign out</button>
        </SignOutButton>
      </div>
    );
  }
  return (
    <form action="/api/auth/logout" method="post" className="flex items-center gap-3">
      {label}
      <button className="text-sm text-mute">Switch person</button>
    </form>
  );
}
