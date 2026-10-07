import { watchUrl } from "@/lib/urls";

/** What the editor downloads. The voice note plays at the top of the job. */
const PACKET_LABEL: Record<string, string> = {
  GENERATED: "Clean video",
  RAW: "Clip",
  REFERENCE: "Reference",
};

export function PacketFiles({
  rawsUrl,
  files,
}: {
  rawsUrl: string;
  files: Array<{ id: string; kind: string; filename: string; path: string; publicUrl: string }>;
}) {
  const packet = files.filter((file) => PACKET_LABEL[file.kind]);
  return (
    <section className="space-y-2 rounded-card border border-line bg-panel p-5">
      <h2 className="font-semibold">Download files</h2>
      <p className="text-sm text-mute">
        Raw clips are in the Google Drive folder. A finished Drive link can be this folder or a different one.
      </p>
      {rawsUrl ? (
        <a
          href={rawsUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl bg-sun px-4 py-3 text-center font-semibold text-ink"
        >
          Open the Google Drive folder
        </a>
      ) : null}
      {packet.length === 0 && !rawsUrl ? (
        <p className="text-sm text-mute">No files yet. Add a Drive folder or clips on the Clips step.</p>
      ) : (
        packet.map((file) => (
          <a
            key={file.id}
            href={watchUrl(file.path)}
            download={file.filename}
            className="flex items-center justify-between rounded-xl bg-lift px-3 py-2 text-sm"
          >
            <span className="truncate">{file.filename}</span>
            <span className="text-mute">{PACKET_LABEL[file.kind]}</span>
          </a>
        ))
      )}
    </section>
  );
}
