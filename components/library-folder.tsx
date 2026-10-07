/** One closed section. Open it to see the videos inside. */
export function LibraryFolder({
  title,
  count,
  open = false,
  children,
}: {
  title: string;
  count: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={open} className="rounded-card border border-line bg-panel">
      <summary className="cursor-pointer px-5 py-4 font-semibold">
        {title}
        <span className="ml-2 text-sm font-normal text-mute">{count}</span>
      </summary>
      <div className="space-y-4 px-5 pb-5">{children}</div>
    </details>
  );
}
