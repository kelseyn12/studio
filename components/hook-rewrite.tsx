"use client";

import { useState } from "react";

export function BriefAi({ cardId }: { cardId: string }) {
  const [note, setNote] = useState("");

  async function rewriteHook() {
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

  async function generateScript() {
    const form = document.querySelector("form");
    if (!form) return;
    const data = new FormData(form);
    setNote("Writing script…");
    const response = await fetch("/api/ai/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: cardId,
        title: data.get("title"),
        premise: data.get("premise"),
        hook: data.get("hook"),
        body: data.get("body"),
        plug: data.get("plug"),
        script: data.get("script"),
        referenceUrl: data.get("referenceUrl"),
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setNote(body.error || "Add OPENAI_API_KEY to .env");
      return;
    }
    const fill = (name: string, value: string) => {
      const field = form.querySelector<HTMLTextAreaElement>(`textarea[name="${name}"]`);
      if (field && value) field.value = value;
    };
    fill("hook", body.hook);
    fill("body", body.body);
    fill("plug", body.plug);
    fill("script", body.script);
    setNote("Script filled — Save or Finish brief");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={rewriteHook} className="rounded-xl border border-line px-3 py-2 text-sm">
        Rewrite hook
      </button>
      <button type="button" onClick={generateScript} className="rounded-xl border border-line px-3 py-2 text-sm">
        Generate script
      </button>
      {note ? <p className="basis-full text-xs text-mute">{note}</p> : null}
    </div>
  );
}
