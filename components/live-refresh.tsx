"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LiveRefresh({
  seconds = 8,
  message = "Updates on its own. No need to refresh.",
}: {
  seconds?: number;
  message?: string;
}) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), seconds * 1000);
    return () => window.clearInterval(timer);
  }, [router, seconds]);
  return <p className="text-xs text-mute">{message}</p>;
}
