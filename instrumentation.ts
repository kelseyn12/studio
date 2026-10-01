export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startPublishSweep } = await import("./instrumentation-node");
    startPublishSweep();
  }
}
