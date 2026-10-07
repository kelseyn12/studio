import Link from "next/link";
import { prisma } from "@/lib/prisma";

/** Stays on every page he opens, so a missed Discord ping is still the first thing in the app. */
export async function EditorFixBanner({ userId, role }: { userId: string; role: string }) {
  if (role !== "EDITOR") return null;
  const fixes = await prisma.card.findMany({
    where: { editorId: userId, status: "EDITING", cutBy: "EDITOR", editorNote: { startsWith: "Fix:" } },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });
  if (fixes.length === 0) return null;
  return (
    <p className="border-b border-line bg-sun px-8 py-3 text-sm font-semibold text-ink">
      Needs changes.{" "}
      {fixes.map((card, index) => (
        <span key={card.id}>
          {index > 0 ? " · " : ""}
          <Link href={`/cards/${card.id}?step=editor`} className="underline">
            {card.title || "A video"}
          </Link>
        </span>
      ))}
      {" "}
      stays here until you drop the new video.
    </p>
  );
}
