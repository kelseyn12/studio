export function Spark({
  points,
  label,
}: {
  points: number[];
  label: string;
}) {
  const width = 720;
  const height = 180;
  const max = Math.max(...points, 1);
  const path = points
    .map((value, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - (value / max) * (height - 16) - 8;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <div className="rounded-card border border-line bg-panel p-5">
      <p className="label">{label}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-44 w-full">
        <path d={path} fill="none" stroke="#E0B36A" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}
