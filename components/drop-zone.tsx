"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DropZone({
  action,
  extra,
  label,
  hint,
  accept,
  maxBytes,
}: {
  action: string;
  extra?: Record<string, string>;
  label: string;
  hint?: string;
  accept?: string;
  maxBytes?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function send(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files).slice(0, 12)) {
      if (maxBytes && file.size > maxBytes) {
        setNote("Too big for Studio. Phone clip or finished video under the limit — 4K days go in Drive.");
        setBusy(false);
        return;
      }
      const body = new FormData();
      body.set("file", file);
      for (const [key, value] of Object.entries(extra ?? {})) body.set(key, value);
      const response = await fetch(action, { method: "POST", body });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setNote(body.error || "Upload failed");
        setBusy(false);
        return;
      }
    }
    setNote(`${Math.min(files.length, 12)} file${files.length === 1 ? "" : "s"} in`);
    setBusy(false);
    router.refresh();
  }

  return (
    <label className="block cursor-pointer rounded-card border border-dashed border-line bg-lift/40 px-4 py-6 text-center">
      <p className="text-sm text-paper">{busy ? "Uploading…" : label}</p>
      <p className="mt-1 text-xs text-mute">{hint ?? "Drop or click · up to 12"}</p>
      {note ? <p className="mt-2 text-xs text-sun">{note}</p> : null}
      <input
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(event) => send(event.target.files)}
      />
    </label>
  );
}
