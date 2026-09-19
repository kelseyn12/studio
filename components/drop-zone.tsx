"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DropZone({
  action,
  extra,
  label,
  accept,
}: {
  action: string;
  extra?: Record<string, string>;
  label: string;
  accept?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function send(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files).slice(0, 12)) {
      const body = new FormData();
      body.set("file", file);
      for (const [key, value] of Object.entries(extra ?? {})) body.set(key, value);
      const response = await fetch(action, { method: "POST", body });
      if (!response.ok) {
        setNote("Upload failed");
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
      <p className="mt-1 text-xs text-mute">Drop or click · up to 12</p>
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
