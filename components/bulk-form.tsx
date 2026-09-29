"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function BulkForm({
  waiting,
  startDate,
}: {
  waiting: number;
  startDate: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setNote("Scheduling… this takes a minute per video. Leave this page open.");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/calendar/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perDay: Number(form.get("perDay")),
          intervalMin: Number(form.get("intervalMin")),
          startHour: Number(form.get("startHour")),
          startDate: form.get("startDate"),
        }),
      });
      const body = await response.json().catch(() => ({}));
      setNote(
        response.ok
          ? `Scheduled ${body.scheduled} · posted ${body.shipped ?? 0} through Outstand`
          : body.error || "Failed",
      );
      router.refresh();
    } catch {
      setNote("Didn't finish. Check the list below before trying again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-card border border-line bg-panel p-5 md:grid-cols-4">
      <label>
        <span className="label">Start</span>
        <input name="startDate" type="date" defaultValue={startDate} className="field" required />
      </label>
      <label>
        <span className="label">Per day</span>
        <input name="perDay" type="number" defaultValue={5} className="field" />
      </label>
      <label>
        <span className="label">First hour</span>
        <input name="startHour" type="number" defaultValue={10} className="field" />
      </label>
      <label>
        <span className="label">Minutes apart</span>
        <input name="intervalMin" type="number" defaultValue={90} className="field" />
      </label>
      <button disabled={pending} className="rounded-xl bg-sun px-4 py-3 font-semibold text-ink disabled:opacity-60 md:col-span-4">
        {pending ? "Scheduling…" : `Schedule ${waiting} video${waiting === 1 ? "" : "s"} on these days`}
      </button>
      <p className="text-xs text-mute md:col-span-4">
        Each video posts to the accounts checked on it — the list below shows exactly where every mix goes.
      </p>
      {note ? <p className="text-sm text-sun md:col-span-5">{note}</p> : null}
    </form>
  );
}
