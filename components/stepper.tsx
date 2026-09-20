import Link from "next/link";
import { DESK_STAGES, type DeskStage } from "@/lib/card-desk";

const LABELS: Record<DeskStage, string> = {
  brief: "Brief",
  footage: "Footage",
  editor: "Editor",
  live: "Live",
};

export function Stepper({ cardId, stage }: { cardId: string; stage: DeskStage }) {
  const current = DESK_STAGES.indexOf(stage);
  return (
    <ol className="grid grid-cols-4 gap-2">
      {DESK_STAGES.map((item, index) => (
        <li key={item}>
          <Link
            href={`/cards/${cardId}?step=${item}`}
            className={`block rounded-xl px-3 py-2 text-center text-xs font-semibold ${
              index === current ? "bg-sun text-ink" : index < current ? "bg-lift text-paper" : "bg-panel text-mute"
            }`}
          >
            {index + 1} {LABELS[item]}
          </Link>
        </li>
      ))}
    </ol>
  );
}
