"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshStats() {
  const router = useRouter();
  const [note, setNote] = useState("");

  async function run() {
    setNote("Pulling…");
    const response = await fetch("/api/analytics/sync", { method: "POST" });
    const body = await response.json();
    setNote(response.ok ? `Updated ${body.updated} posts` : body.error || "Failed");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={run} className="rounded-xl border border-line px-4 py-2 text-sm">
        Pull from Outstand
      </button>
      {note ? <p className="text-sm text-mute">{note}</p> : null}
    </div>
  );
}
