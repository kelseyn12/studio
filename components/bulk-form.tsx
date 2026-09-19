"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function BulkForm({
  waiting,
  accounts,
}: {
  waiting: number;
  accounts: Array<{ id: string; username: string; network: string }>;
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
        accountId: form.get("accountId"),
      }),
    });
    const body = await response.json();
    setNote(response.ok ? `Spaced ${body.scheduled} posts` : body.error || "Failed");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-card border border-line bg-panel p-5 md:grid-cols-5">
      <label>
        <span className="label">Start</span>
        <input name="startDate" type="date" className="field" required />
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
      <label>
        <span className="label">Account</span>
        <select name="accountId" className="field">
          <option value="">Keep current</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              @{account.username}
            </option>
          ))}
        </select>
      </label>
      <button className="rounded-xl bg-sun px-4 py-3 font-semibold text-ink md:col-span-5">
        Auto-space {waiting} ready video{waiting === 1 ? "" : "s"}
      </button>
      {note ? <p className="text-sm text-sun md:col-span-5">{note}</p> : null}
    </form>
  );
}
