"use client";

import { deleteVideo } from "@/app/cards/[id]/actions";

export function DeleteVideoButton({ id }: { id: string }) {
  return (
    <form
      action={deleteVideo}
      onSubmit={(event) => {
        if (!window.confirm("Delete this video? This cannot be undone.")) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="text-sm text-mute">Delete this video</button>
    </form>
  );
}
