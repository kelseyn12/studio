import Link from "next/link";
import type { SetupStep } from "@/lib/setup";

export function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const open = steps.filter((step) => !step.done);
  if (open.length === 0) return null;
  const done = steps.length - open.length;
  return (
    <section className="rounded-2xl border border-line bg-panel p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">Set up Studio</p>
        <p className="text-xs text-mute">
          {done} of {steps.length} done
        </p>
      </div>
      <div className="space-y-1">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${step.done ? "opacity-45" : "hover:bg-lift"}`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                step.done ? "bg-live text-ink" : "border border-line text-mute"
              }`}
            >
              {step.done ? "✓" : ""}
            </span>
            <span className="min-w-0">
              <span className={`block text-sm font-medium ${step.done ? "line-through" : ""}`}>{step.label}</span>
              {!step.done ? <span className="block text-xs text-mute">{step.detail}</span> : null}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
