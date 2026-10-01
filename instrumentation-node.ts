const holder = globalThis as unknown as { studioSweep?: ReturnType<typeof setInterval> };

export function startPublishSweep(): void {
  if (holder.studioSweep) return;
  const tick = () => {
    void import("@/lib/publish-sweep").then((mod) => mod.sweepFailedPublishes());
  };
  setTimeout(tick, 20_000);
  holder.studioSweep = setInterval(tick, 3 * 60 * 1000);
}
