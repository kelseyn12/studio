"use client";

import { deleteVideo } from "@/app/cards/[id]/actions";

export function DeleteVideoButton({ id, back, label = "Delete this video" }: { id: string; back?: string; label?: string }) {
  return (
    <form
      action={deleteVideo}
      onSubmit={(event) => {
        if (!window.confirm("Delete this video? This cannot be undone.")) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {back ? <input type="hidden" name="next" value={back} /> : null}
      <button className="text-sm text-mute">{label}</button>
    </form>
  );
}
