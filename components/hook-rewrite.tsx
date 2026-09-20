"use client";

import { useState } from "react";

export function HookRewrite() {
  const [note, setNote] = useState("");

  async function run() {
    const form = document.querySelector("form");
    if (!form) return;
    const data = new FormData(form);
    setNote("Rewriting…");
    const response = await fetch("/api/ai/hook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hook: data.get("hook"),
        premise: data.get("premise"),
        script: data.get("script"),
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setNote(body.error || "Add OPENAI_API_KEY to .env");
      return;
    }
    const field = form.querySelector<HTMLTextAreaElement>('textarea[name="hook"]');
    if (field) field.value = body.hook;
    setNote("Hook updated — Save or Finish brief");
  }

  return (
    <div>
      <button type="button" onClick={run} className="rounded-xl border border-line px-3 py-2 text-sm">
        Rewrite hook
      </button>
      {note ? <p className="mt-2 text-xs text-mute">{note}</p> : null}
    </div>
  );
}
