"use client";

import { useState } from "react";

export function VoiceBox({ cardId }: { cardId: string }) {
  const [status, setStatus] = useState("Idle");

  async function record() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => chunks.push(event.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const file = new File([blob], "voice-note.webm", { type: "audio/webm" });
      const body = new FormData();
      body.set("id", cardId);
      body.set("kind", "VOICE");
      body.set("file", file);
      await fetch("/api/assets", { method: "POST", body });
      setStatus("Saved voice note");
      stream.getTracks().forEach((track) => track.stop());
    };
    recorder.start();
    setStatus("Recording 20s…");
    window.setTimeout(() => recorder.stop(), 20000);
  }

  return (
    <div className="mt-4">
      <button type="button" onClick={record} className="rounded-xl bg-sun px-4 py-2 text-sm font-semibold text-ink">
        Record a voice note
      </button>
      <p className="mt-2 text-xs text-mute">{status}</p>
    </div>
  );
}
