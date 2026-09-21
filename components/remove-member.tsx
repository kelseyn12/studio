"use client";

import { removeMember } from "@/app/team/actions";

export function RemoveMemberButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={removeMember}
      onSubmit={(event) => {
        if (!window.confirm(`Remove ${name}? They lose access right away. Their finished work stays.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="text-sm text-mute hover:text-review">Remove</button>
    </form>
  );
}
