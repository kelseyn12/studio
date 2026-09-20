import Link from "next/link";

const STEPS = [
  { n: "1", title: "Clips", href: "/repurposer", text: "Drop hooks, bodies, and CTAs from one filming sit." },
  { n: "2", title: "Multiply", href: "/repurposer", text: "Mix the stories, then make unique copies so files do not match." },
  { n: "3", title: "Ready", href: "/library", text: "Generated files land as Ready cards. CapCut only if something still needs a cut." },
  { n: "4", title: "Ship", href: "/calendar", text: "Auto-space the week and send through Outstand." },
];

export function StudioMap() {
  return (
    <div>
      <ol className="grid gap-2 md:grid-cols-4">
        {STEPS.map((step) => (
          <li key={step.n}>
            <Link href={step.href} className="block rounded-card border border-line bg-panel px-4 py-3 hover:bg-lift">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mute">
                {step.n} · {step.title}
              </p>
              <p className="mt-2 text-sm text-mute">{step.text}</p>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-mute">
        Original videos still use <Link href="/plan" className="text-sun">Plan</Link> → film →{" "}
        <Link href="/edits" className="text-sun">CapCut in</Link>. Deals are labels, not a step.
      </p>
    </div>
  );
}
