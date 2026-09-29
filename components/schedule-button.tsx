"use client";

import { useFormStatus } from "react-dom";

/** Stays on "Scheduling…" and ignores extra clicks while the post is going out. */
export function ScheduleButton({
  label,
  pendingLabel = "Scheduling…",
  className,
}: {
  label: string;
  pendingLabel?: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-60`}>
      {pending ? pendingLabel : label}
    </button>
  );
}
