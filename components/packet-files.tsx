import { StartLink } from "@/components/start-link";
import { watchUrl } from "@/lib/urls";

/** What the editor downloads. The clean Multiply video is the one he puts words on. */
const PACKET_LABEL: Record<string, string> = {
  GENERATED: "Clean video",
  RAW: "Clip",
  VOICE: "Voice note",
  REFERENCE: "Reference",
};

export function PacketFiles({
  rawsUrl,
  files,
  cardId,
}: {
  rawsUrl: string;
  files: Array<{ id: string; kind: string; filename: string; path: string; publicUrl: string }>;
  /** Set for the editor. Downloading moves To cut into Cutting. */
  cardId?: string;
}) {
  const packet = files.filter((file) => PACKET_LABEL[file.kind]);
  return (
    <section className="space-y-2 rounded-card border border-line bg-panel p-5">
      <h2 className="font-semibold">Download files</h2>
      <p className="text-sm text-mute">Get the clips onto your computer. Cut the finished video. Drop it back here.</p>
      {rawsUrl ? (
        <StartLink href={rawsUrl} cardId={cardId} className="block w-full rounded-xl bg-sun px-4 py-3 text-center font-semibold text-ink">
          Open 4K folder
        </StartLink>
      ) : null}
      {packet.length === 0 && !rawsUrl ? (
        <p className="text-sm text-mute">No files yet. Add a Drive folder or clips on the Clips step.</p>
      ) : (
        packet.map((file) => (
          <StartLink
            key={file.id}
            href={watchUrl(file.path)}
            download={file.filename}
            cardId={cardId}
            className="flex w-full items-center justify-between rounded-xl bg-lift px-3 py-2 text-left text-sm"
          >
            <span className="truncate">{file.filename}</span>
            <span className="text-mute">{PACKET_LABEL[file.kind]}</span>
          </StartLink>
        ))
      )}
    </section>
  );
}
