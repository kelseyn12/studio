import { publicFileUrl } from "@/lib/urls";

export function PacketFiles({
  rawsUrl,
  files,
}: {
  rawsUrl: string;
  files: Array<{ id: string; kind: string; filename: string; path: string; publicUrl: string }>;
}) {
  const packet = files.filter((file) => file.kind === "RAW" || file.kind === "VOICE" || file.kind === "REFERENCE");
  return (
    <section className="space-y-2 rounded-card border border-line bg-panel p-5">
      <h2 className="font-semibold">Download packet</h2>
      <p className="text-sm text-mute">Get the files onto your machine. Cut in CapCut. Come back and drop the 1080.</p>
      {rawsUrl ? (
        <a href={rawsUrl} target="_blank" rel="noreferrer" className="block rounded-xl bg-sun px-4 py-3 text-center font-semibold text-ink">
          Open 4K folder
        </a>
      ) : null}
      {packet.length === 0 && !rawsUrl ? (
        <p className="text-sm text-mute">No files yet. Footage needs a Drive folder or uploaded clips.</p>
      ) : (
        packet.map((file) => (
          <a
            key={file.id}
            href={file.publicUrl || publicFileUrl(file.path)}
            download={file.filename}
            className="flex items-center justify-between rounded-xl bg-lift px-3 py-2 text-sm"
          >
            <span className="truncate">{file.filename}</span>
            <span className="text-mute">{file.kind}</span>
          </a>
        ))
      )}
    </section>
  );
}
