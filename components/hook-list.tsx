"use client";

export function HookList({
  list,
  listAt,
  onList,
  onBlur,
  onReveal,
}: {
  list: string;
  listAt?: number[];
  onList: (value: string) => void;
  onBlur: () => void;
  onReveal: () => void;
}) {
  const lines = list.split("\n").map((line) => line.trim()).filter(Boolean);
  const filled = lines.filter((_, index) => Number.isFinite(listAt?.[index])).length;

  return (
    <div className="space-y-1">
      <textarea
        value={list}
        placeholder={"One point per line\nYour birthday month\nNobody talks about this"}
        className="field min-h-16 px-2 py-1 text-xs"
        onChange={(event) => onList(event.target.value)}
        onBlur={onBlur}
      />
      <button type="button" onClick={onReveal} className="w-full rounded-lg border border-line px-2 py-1 text-[11px] text-mute">
        This line now
      </button>
      <p className="text-[11px] text-mute">
        Numbers stay up from the start. Scrub to when you say a point, tap This line now
        {filled ? ` (${filled}/${lines.length || 0} filled).` : "."} Words do not listen — you tap each one.
      </p>
    </div>
  );
}
