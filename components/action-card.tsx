import Link from "next/link";
import type { StudioAction } from "@/lib/next-action";

export function ActionCard({ action }: { action: StudioAction }) {
  return (
    <Link
      href={action.href}
      className="block rounded-3xl bg-sun px-8 py-8 text-ink transition hover:brightness-[1.03]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em]">Do this next</p>
      <h2 className="mt-3 text-4xl font-semibold tracking-tight">{action.title}</h2>
      <p className="mt-3 max-w-2xl text-base text-ink/70">{action.detail}</p>
    </Link>
  );
}
