import { publicFileUrl } from "@/lib/urls";

export function MediaRow({
  kind,
  filename,
  path,
  mime,
}: {
  kind: string;
  filename: string;
  path: string;
  mime: string;
}) {
  const href = publicFileUrl(path);
  const audio = mime.startsWith("audio") || filename.endsWith(".webm") || filename.endsWith(".mp3");
  const video = mime.startsWith("video") || filename.endsWith(".mp4") || filename.endsWith(".mov");
  return (
    <div className="rounded-card border border-line bg-panel p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-mute">{kind}</span>
        <a href={href} className="text-sun" download={filename}>
          Download
        </a>
      </div>
      <p className="mb-2 truncate text-sm">{filename}</p>
      {audio ? <audio controls src={href} className="w-full" /> : null}
      {video ? <video controls src={href} className="max-h-64 w-full rounded-xl bg-ink" /> : null}
    </div>
  );
}
