export function AlignGuides({
  horizontals,
  verticals,
}: {
  horizontals: number[];
  verticals: number[];
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute top-0 bottom-0 w-px bg-white/55" style={{ left: "50%" }} />
      <p className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-wide text-white/55">center</p>
      {verticals
        .filter((x) => Math.abs(x - 0.5) > 0.01)
        .map((x) => (
          <div key={`v${x}`} className="absolute top-0 bottom-0 w-px bg-white/25" style={{ left: `${x * 100}%` }} />
        ))}
      {horizontals.map((y) => (
        <div key={`h${y}`} className="absolute left-0 right-0 h-px bg-white/35" style={{ top: `${y * 100}%` }} />
      ))}
    </div>
  );
}
