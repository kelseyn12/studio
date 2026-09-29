export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const holder = globalThis as unknown as { studioSweep?: ReturnType<typeof setInterval> };
  if (holder.studioSweep) return;
  const tick = () => {
    void import("@/lib/publish-sweep").then((mod) => mod.sweepFailedPublishes());
  };
  setTimeout(tick, 20_000);
  holder.studioSweep = setInterval(tick, 3 * 60 * 1000);
}
