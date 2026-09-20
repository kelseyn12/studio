import type { PipelineStatus } from "@/lib/pipeline";

const STEPS = ["Write", "Make", "Ready", "Posted"] as const;

function stepIndex(status: PipelineStatus): number {
  if (status === "IDEA" || status === "SCRIPTED") return 0;
  if (status === "FILMED" || status === "EDITING" || status === "REVIEW") return 1;
  if (status === "READY") return 2;
  return 3;
}

export function Stepper({ status }: { status: PipelineStatus }) {
  const current = stepIndex(status);
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((step, index) => (
        <li
          key={step}
          className={`rounded-xl px-3 py-2 text-center text-xs font-semibold ${
            index === current ? "bg-sun text-ink" : index < current ? "bg-lift text-paper" : "bg-panel text-mute"
          }`}
        >
          {step}
        </li>
      ))}
    </ol>
  );
}
