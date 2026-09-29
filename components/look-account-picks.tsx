"use client";

import { accountsForLook, handle, LOOK_APPS, networkShort } from "@/lib/targets";

type PickAccount = {
  id: string;
  network: string;
  username: string;
  nickname?: string;
  name?: string;
  isActive: boolean;
};

export function LookAccountPicks({
  look,
  tag,
  accounts,
  selectedIds,
  controlled = false,
  onToggle,
}: {
  look: string;
  tag: string;
  accounts: PickAccount[];
  selectedIds: string[];
  controlled?: boolean;
  onToggle?: (id: string, on: boolean) => void;
}) {
  const choices = accountsForLook(accounts, look);
  const apps = LOOK_APPS[look] ?? [];
  if (choices.length === 0) {
    return <p className="text-xs text-mute">No {tag} accounts connected yet. Add them on Accounts.</p>;
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-mute">
        This mix is for {apps.join(" and ") || tag}. Check every account it should go to — as many as you want.
      </p>
      {choices.map((account) => {
        const on = selectedIds.includes(account.id);
        const label = account.nickname || account.name || handle(account.username);
        return (
          <label key={account.id} className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="accountIds"
              value={account.id}
              {...(controlled
                ? { checked: on, onChange: () => onToggle?.(account.id, !on) }
                : { defaultChecked: on })}
            />
            <span className="rounded-full bg-lift px-2 py-0.5 text-xs font-semibold">{networkShort(account.network)}</span>
            <span>{label}</span>
          </label>
        );
      })}
    </div>
  );
}
