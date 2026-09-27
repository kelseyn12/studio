/** Instagram: one chip per line. TikTok (`together`): one card around every line. */
export function WordChips({
  lines,
  className,
  empty = "Type here",
  together = false,
}: {
  lines: string[];
  className: string;
  empty?: string;
  together?: boolean;
}) {
  const rows = lines.length ? lines : [empty];
  if (together) {
    return (
      <div className={`pointer-events-none mx-auto w-fit max-w-full text-center ${className}`}>
        {rows.map((line, index) => (
          <div key={`${index}-${line}`}>{line.replace(/\*([^*]+)\*/g, "$1")}</div>
        ))}
      </div>
    );
  }
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
