import { CutsBucket } from "@/components/cuts-bucket";
import { EditorBatch } from "@/components/editor-batch";
import { LiveRefresh } from "@/components/live-refresh";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { groupEditorBatches } from "@/lib/editor-batches";
import { prisma } from "@/lib/prisma";
import { batchByCard } from "@/lib/queries";
import { formatBytes, STUDIO_FILE_MAX_BYTES } from "@/lib/storage";
import { watchUrl } from "@/lib/urls";

export default async function EditsPage() {
  const user = await requireUser();
  const editor = user.role === "EDITOR";
  const mine = editor ? { editorId: user.id } : {};
  const [cards, batches] = await Promise.all([
    prisma.card.findMany({
      where: { status: { in: ["FILMED", "EDITING", "REVIEW"] }, ...mine },
      include: { campaign: true, assets: true, editor: true },
      orderBy: { updatedAt: "desc" },
    }),
    batchByCard(),
  ]);
  const { folders, loose } = groupEditorBatches(cards, batches);
  const selfCut = editor ? [] : loose.filter((card) => card.status === "FILMED" && card.cutBy === "SELF");
  const send = loose.filter((card) => card.status === "FILMED" && card.cutBy === "EDITOR");
  const cutting = loose.filter((card) => card.status === "EDITING");
  const review = loose.filter((card) => card.status === "REVIEW");
  const sizeLabel = formatBytes(STUDIO_FILE_MAX_BYTES);

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">{editor ? "Your cuts" : "Cuts"}</h1>
      <p className="mt-2 mb-2 max-w-2xl text-mute">
        {editor
          ? "A batch arrives as a folder. Download the clean videos, put the words on in CapCut, add captions, and drop the files back named with the mix number, like mix 2.mp4. A raw-clip job is not a folder. It shows up under To cut, one video at a time, with the clips and the script."
          : "Each folder is one Multiply batch. Open it to see every mix, the words on each, and which finished files are in. Raw-clip jobs are listed under the folders, one video at a time."}
      </p>
      <div className="mb-6">
        <LiveRefresh seconds={30} />
      </div>
      {folders.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Batches · {folders.length}</h2>
          <div className="space-y-3">
            {folders.map((folder) => (
              <EditorBatch
                key={folder.key}
                name={folder.name}
                editor={editor}
                maxBytes={STUDIO_FILE_MAX_BYTES}
                sizeLabel={sizeLabel}
                rows={folder.rows.map((row) => ({
                  ...row,
                  cleanFiles: row.cleanFiles.map((file) => ({ url: watchUrl(file.path), filename: file.filename })),
                }))}
              />
            ))}
          </div>
        </section>
      ) : editor ? (
        <p className="mb-8 rounded-card border border-dashed border-line px-5 py-6 text-sm text-mute">
          No batch folders yet. They show up here when she sends one.
        </p>
      ) : null}
      {editor ? null : (
        <CutsBucket title="Drop the file" items={selfCut} empty="Nothing waiting for a finished file." canDelete />
      )}
      <CutsBucket
        title={editor ? "To cut" : "Send"}
        items={send}
        empty={editor ? "No raw-clip jobs yet." : "Nothing waiting to send."}
        canDelete={!editor}
      />
      <CutsBucket
        title={editor ? "Cutting" : "With the editor"}
        items={cutting}
        empty={editor ? "No raw-clip job in progress." : "Nothing with the editor."}
        canDelete={!editor}
      />
      <CutsBucket
        title="To approve"
        items={review}
        empty={editor ? "Nothing sent back yet." : "Nothing waiting for you."}
        canDelete={!editor}
      />
    </Shell>
  );
}
