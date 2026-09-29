import Link from "next/link";
import type { WaitingLook } from "@/lib/card-desk";

/** Finished mixes with no day yet — same look pills as Multiply, plus exactly where each file posts. */
export function WaitingVideos({
  cards,
}: {
  cards: Array<{ id: string; title: string; lines: WaitingLook[] }>;
}) {
  return (
    <div className="space-y-2">
      {cards.map((card) => (
        <div key={card.id} className="rounded-card border border-line bg-panel px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 flex-1 basis-56 break-words text-sm font-medium">{card.title}</p>
            <Link href={`/cards/${card.id}?step=live`} className="shrink-0 text-sm text-sun">
              Check accounts + cover
            </Link>
          </div>
          <div className="mt-2 space-y-1.5">
            {card.lines.map((line) => (
              <p key={line.tag} className="flex flex-wrap items-center gap-2 text-xs text-mute">
                <span className="shrink-0 rounded-full bg-sun px-2.5 py-0.5 font-semibold text-ink">{line.tag}</span>
                {line.who ? (
                  <span>{line.who}</span>
                ) : (
                  <span className="font-semibold text-sun">
                    Nothing checked for these apps — this video will not post. Tap Check accounts + cover.
                  </span>
                )}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
