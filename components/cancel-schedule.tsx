"use client";

import { unscheduleCard } from "@/app/calendar/actions";

/** Asks first, then tells Outstand to drop the post and clears the day. */
export function CancelSchedule({ cardId }: { cardId: string }) {
  return (
    <form
      action={unscheduleCard}
      onSubmit={(event) => {
        if (!window.confirm("Take this video off the calendar? It will not post.")) event.preventDefault();
      }}
    >
      <input type="hidden" name="cardId" value={cardId} />
      <button className="rounded-lg border border-line px-3 py-1.5 text-xs">Cancel</button>
    </form>
  );
}
