"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { deleteSelectedVideos } from "@/app/library/actions";

type PickState = {
  picked: Set<string>;
  allOn: boolean;
  toggle: (id: string) => void;
  selectAll: () => void;
};

const PickContext = createContext<PickState | null>(null);

export function usePicked(ids: string[]) {
  const all = [...new Set(ids.filter(Boolean))];
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const allOn = all.length > 0 && all.every((id) => picked.has(id));

  function toggle(id: string) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setPicked(allOn ? new Set() : new Set(all));
  }

  return { all, picked, allOn, toggle, selectAll };
}

export function VideoPick({ ids, children }: { ids: string[]; children: ReactNode }) {
  const pick = usePicked(ids);
  return <PickContext.Provider value={pick}>{children}</PickContext.Provider>;
}

function usePick(): PickState {
  const pick = useContext(PickContext);
  if (!pick) throw new Error("VideoPick missing");
  return pick;
}

export function SelectDeleteBar({
  total,
  batchId,
  field = "cardId",
}: {
  total: number;
  batchId?: string;
  field?: "cardId" | "outputId";
}) {
  const { picked, allOn, selectAll } = usePick();
  if (total === 0) return null;
  const count = picked.size;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <button type="button" onClick={selectAll} className="rounded-xl border border-line px-4 py-2 text-sm">
        {allOn ? "Clear selection" : "Select all"}
      </button>
      {count > 0 ? (
        <form
          action={deleteSelectedVideos}
          onSubmit={(event) => {
            if (!window.confirm(`Delete ${count} video${count === 1 ? "" : "s"}? This cannot be undone.`)) {
              event.preventDefault();
            }
          }}
        >
          {batchId ? <input type="hidden" name="batchId" value={batchId} /> : null}
          {[...picked].map((id) => (
            <input key={id} type="hidden" name={field} value={id} />
          ))}
          <button className="rounded-xl border border-line px-4 py-2 text-sm text-mute">
            Delete {count} selected
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function PickBox({ id }: { id: string }) {
  const { picked, toggle } = usePick();
  return (
    <label className="flex items-center gap-2 text-sm text-mute">
      <input type="checkbox" checked={picked.has(id)} onChange={() => toggle(id)} />
      Select
    </label>
  );
}
