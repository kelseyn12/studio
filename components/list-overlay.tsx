export function ListOverlay({
  rows,
  lines,
  className,
}: {
  rows: Array<{ x: number; y: number }>;
  lines: string[];
  className: string;
}) {
  return (
    <>
      {rows.map((row, index) => (
        <p
          key={index}
          className={`pointer-events-none absolute z-20 -translate-y-1/2 text-left ${className}`}
          style={{ left: `${row.x * 100}%`, top: `${row.y * 100}%` }}
        >
          {lines[index] ? `${index + 1}. ${lines[index]}` : `${index + 1}.`}
        </p>
      ))}
    </>
  );
}
