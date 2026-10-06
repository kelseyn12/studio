"use client";

import { startCutting } from "@/app/cards/[id]/actions";

/** Opens the file, and moves his job from To cut to Cutting when he is the editor. */
export function StartLink({
  href,
  cardId,
  download,
  className,
  children,
}: {
  href: string;
  cardId?: string;
  download?: string;
  className?: string;
  children: React.ReactNode;
}) {
  function open() {
    if (cardId) void startCutting(cardId);
    if (download) {
      const link = document.createElement("a");
      link.href = href;
      link.download = download;
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  );
}
