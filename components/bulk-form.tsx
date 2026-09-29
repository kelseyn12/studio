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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
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
    const body = await response.json();
    setNote(
      response.ok
        ? `Scheduled ${body.scheduled} · posted ${body.shipped ?? 0} through Outstand`
        : body.error || "Failed",
    );
    router.refresh();
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
      <button className="rounded-xl bg-sun px-4 py-3 font-semibold text-ink md:col-span-4">
        Schedule {waiting} video{waiting === 1 ? "" : "s"} on these days
      </button>
      <p className="text-xs text-mute md:col-span-4">
        Each video posts to the accounts checked on it — the list below shows exactly where every mix goes.
      </p>
      {note ? <p className="text-sm text-sun md:col-span-5">{note}</p> : null}
    </form>
  );
}
