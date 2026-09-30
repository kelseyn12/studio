"use client";

import { markYouTubeDownloaded } from "@/app/calendar/actions";
import { useRouter } from "next/navigation";

/** Saves the YouTube file, then counts that app as posted. */
export function DownloadPosted({
  jobId,
  href,
  filename,
}: {
  jobId: string;
  href: string;
  filename: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="inline-block rounded-xl border border-line px-3 py-1.5 text-sm font-semibold"
      onClick={async () => {
        const link = document.createElement("a");
        link.href = href;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        await markYouTubeDownloaded(jobId);
        router.refresh();
      }}
    >
      Download YouTube file
    </button>
  );
}
