import { CoverPick } from "@/components/cover-pick";
import { FinishedDrop } from "@/components/finished-drop";
import { LookAccountPicks } from "@/components/look-account-picks";
import { formatBytes, STUDIO_FILE_MAX_BYTES } from "@/lib/storage";
import { describeTargets, LOOK_APPS } from "@/lib/targets";
import { watchUrl } from "@/lib/urls";

type LookAsset = {
  id: string;
  path: string;
  filename: string;
  coverAt?: number;
};

type LookAccount = { network: string; username: string };

type PickAccount = {
  id: string;
  network: string;
  username: string;
  nickname?: string;
  isActive: boolean;
};

export function LiveLooks({
  cardId,
  rows,
  canCover,
  accounts,
  selectedIds,
}: {
  cardId: string;
  rows: Array<{ look: string; tag: string; accounts: LookAccount[]; asset?: LookAsset }>;
  canCover: boolean;
  accounts?: PickAccount[];
  selectedIds?: string[];
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <section key={row.look} className="space-y-3 rounded-card border border-line bg-panel px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {(LOOK_APPS[row.look] ?? [row.tag]).map((app) => (
              <p key={app} className="rounded-full bg-sun px-2.5 py-0.5 text-xs font-semibold text-ink">
                {app}
              </p>
            ))}
            <p className="text-sm text-mute">
              {row.accounts.length > 0 ? describeTargets(row.accounts) : "Pick the accounts below."}
            </p>
          </div>
          {row.asset ? (
            <>
              <a href={watchUrl(row.asset.path)} className="block rounded-xl border border-line px-4 py-3 text-center">
                Watch {row.asset.filename}
              </a>
              {canCover ? (
                <CoverPick id={row.asset.id} src={watchUrl(row.asset.path)} coverAt={row.asset.coverAt} />
              ) : null}
            </>
          ) : (
            <FinishedDrop
              cardId={cardId}
              look={row.look === "tiktok" ? "tiktok" : "instagram"}
              maxBytes={STUDIO_FILE_MAX_BYTES}
              sizeLabel={formatBytes(STUDIO_FILE_MAX_BYTES)}
            />
          )}
          {accounts ? (
            <LookAccountPicks look={row.look} tag={row.tag} accounts={accounts} selectedIds={selectedIds ?? []} />
          ) : null}
        </section>
      ))}
    </div>
  );
}
