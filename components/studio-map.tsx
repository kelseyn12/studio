import Link from "next/link";

export function StudioMap() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Link href="/repurposer" className="rounded-card border border-line bg-panel px-5 py-4 hover:bg-lift">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mute">Volume</p>
        <p className="mt-2 text-lg font-semibold">Multiply → Live</p>
        <p className="mt-1 text-sm text-mute">Hooks × bodies × CTAs become Ready files. Then you park them.</p>
      </Link>
      <Link href="/plan" className="rounded-card border border-line bg-panel px-5 py-4 hover:bg-lift">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mute">Original</p>
        <p className="mt-2 text-lg font-semibold">Plan month → CapCut → Live</p>
        <p className="mt-1 text-sm text-mute">Book the day. Film. Send the folder. Approve the cut. Then it can ship.</p>
      </Link>
    </div>
  );
}
