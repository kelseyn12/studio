"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const RECORD_SECONDS = 20;

/** One tap records up to 20 seconds, then the words become the editor note. */
export function VoiceBox({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const tick = window.setTimeout(() => setSecondsLeft((current) => (current === null ? null : current - 1)), 1000);
    return () => window.clearTimeout(tick);
  }, [secondsLeft]);

  async function record() {
    const current = recorderRef.current;
    if (current && current.state === "recording") {
      current.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        setSecondsLeft(null);
        setStatus("Saving the note…");
        const file = new File([new Blob(chunks, { type: "audio/webm" })], "voice-note.webm", { type: "audio/webm" });
        const body = new FormData();
        body.set("id", cardId);
        body.set("kind", "VOICE");
        body.set("file", file);
        const response = await fetch("/api/assets", { method: "POST", body });
        const payload = (await response.json().catch(() => ({}))) as { transcript?: string; error?: string };
        stream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;
        if (!response.ok) {
          setStatus(payload.error || "The note did not save. Try again.");
          return;
        }
        setStatus(payload.transcript ? `Saved. Record again to replace it. ${payload.transcript.slice(0, 80)}` : "Saved. Record again to replace it.");
        router.refresh();
      };
      recorder.start();
      setStatus("");
      setSecondsLeft(RECORD_SECONDS);
      window.setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, RECORD_SECONDS * 1000);
    } catch {
      setSecondsLeft(null);
      setStatus("The browser blocked the microphone. Allow the mic, then try again.");
    }
  }

  const recording = secondsLeft !== null;

  return (
    <div className="mt-4 space-y-2">
      <button type="button" onClick={record} className="rounded-xl bg-sun px-4 py-2 text-sm font-semibold text-ink">
        {recording ? "Stop recording" : "Record a voice note"}
      </button>
      {recording ? (
        <p className="flex items-center gap-2 rounded-xl bg-review/20 px-4 py-3 text-sm font-semibold">
          <span className="inline-block h-3 w-3 shrink-0 animate-pulse rounded-full bg-review" />
          Recording. Talk now. {secondsLeft}s left.
        </p>
      ) : (
        <p className="text-sm text-mute">
          {status || "Talk for up to 20 seconds. Delete it under the player if you do not want it, then record again."}
        </p>
      )}
    </div>
  );
}
