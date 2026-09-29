import { CoverPick } from "@/components/cover-pick";
import { describeTargets } from "@/lib/targets";
import { watchUrl } from "@/lib/urls";

type LookAsset = {
  id: string;
  path: string;
  filename: string;
  coverAt?: number;
};

type LookAccount = { network: string; username: string };

export function LiveLooks({
  rows,
  canCover,
}: {
  rows: Array<{ look: string; tag: string; accounts: LookAccount[]; asset: LookAsset }>;
  canCover: boolean;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <section key={row.look} className="space-y-3 rounded-card border border-line bg-panel px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="rounded-full bg-sun px-2.5 py-0.5 text-xs font-semibold text-ink">{row.tag}</p>
            <p className="text-sm text-mute">
              {row.accounts.length > 0 ? describeTargets(row.accounts) : "This file. Pick accounts below."}
            </p>
          </div>
          <a href={watchUrl(row.asset.path)} className="block rounded-xl border border-line px-4 py-3 text-center">
            Watch {row.asset.filename}
          </a>
          {canCover ? (
            <CoverPick id={row.asset.id} src={watchUrl(row.asset.path)} coverAt={row.asset.coverAt} compact />
          ) : null}
        </section>
      ))}
    </div>
  );
}
