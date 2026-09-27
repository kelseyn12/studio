/** One hugging chip per wrapped line — how TT/IG paint a text box. */
export function WordChips({
  lines,
  className,
  empty = "Type here",
}: {
  lines: string[];
  className: string;
  empty?: string;
}) {
  const rows = lines.length ? lines : [empty];
  return (
    <div className="pointer-events-none flex flex-col items-center gap-[3px]">
      {rows.map((line, index) => (
        <span key={`${index}-${line}`} className={`w-fit max-w-full text-center ${className}`}>
          {line.replace(/\*([^*]+)\*/g, "$1")}
        </span>
      ))}
    </div>
  );
}
