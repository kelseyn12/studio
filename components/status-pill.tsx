import { PIPELINE_META, type PipelineStatus } from "@/lib/pipeline";

const TONE: Record<string, string> = {
  idea: "bg-idea/20 text-zinc-200",
  script: "bg-script/15 text-script",
  film: "bg-film/15 text-film",
  edit: "bg-edit/15 text-edit",
  review: "bg-review/15 text-review",
  ready: "bg-ready/15 text-ready",
  live: "bg-live/15 text-live",
  data: "bg-data/15 text-data",
};

export function StatusPill({ status }: { status: PipelineStatus }) {
  const meta = PIPELINE_META[status];
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${TONE[meta.color]}`}>
      {meta.label}
    </span>
  );
}
