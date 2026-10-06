import { deleteAsset } from "@/app/library/actions";
import { watchUrl } from "@/lib/urls";

export function MediaRow({
  id,
  kind,
  filename,
  path,
  mime,
  canDelete = false,
}: {
  id?: string;
  kind: string;
  filename: string;
  path: string;
  mime: string;
  publicUrl?: string;
  canDelete?: boolean;
}) {
  const href = watchUrl(path);
  const audio = mime.startsWith("audio") || filename.endsWith(".webm") || filename.endsWith(".mp3");
  const video = mime.startsWith("video") || filename.endsWith(".mp4") || filename.endsWith(".mov");
  return (
    <div className="rounded-card border border-line bg-panel p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-mute">{kind === "RAW" ? "Clip" : kind === "EDITED" || kind === "GENERATED" ? "Finished" : kind === "VOICE" ? "Voice" : kind === "REFERENCE" ? "Reference" : kind}</span>
        <span className="flex items-center gap-3">
          {kind === "VOICE" && canDelete && id ? (
            <form action={deleteAsset}>
              <input type="hidden" name="id" value={id} />
              <button className="text-mute">Delete</button>
            </form>
          ) : null}
          <a href={href} className="text-sun" download={filename}>
            Download
          </a>
        </span>
      </div>
      <p className="mb-2 truncate text-sm">{filename}</p>
      {audio ? <audio controls src={href} className="w-full" /> : null}
      {video ? <video controls src={href} className="max-h-64 w-full rounded-xl bg-ink" /> : null}
    </div>
  );
}
