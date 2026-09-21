"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function VoiceBox({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState("Idle");

  async function record() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => chunks.push(event.data);
    recorder.onstop = async () => {
      const file = new File([new Blob(chunks, { type: "audio/webm" })], "voice-note.webm", {
        type: "audio/webm",
      });
      const body = new FormData();
      body.set("id", cardId);
      body.set("kind", "VOICE");
      body.set("file", file);
      const response = await fetch("/api/assets", { method: "POST", body });
      const payload = (await response.json().catch(() => ({}))) as { transcript?: string };
      setStatus(payload.transcript ? `Editor note: ${payload.transcript.slice(0, 80)}` : "Voice note saved");
      stream.getTracks().forEach((track) => track.stop());
      router.refresh();
    };
    recorder.start();
    setStatus("Recording 20s… say what you want");
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
