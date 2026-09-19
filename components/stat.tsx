export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-sm text-mute">{hint}</p> : null}
    </div>
  );
}
