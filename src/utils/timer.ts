export function stableInterval(
  callback: (() => void) | (() => Promise<void>),
  interval: number
) {
  let expectedTime = Date.now() + interval;
  let timeoutId: NodeJS.Timeout | null = null;
  let stopped = false;

  async function step() {
    if (stopped) {
      return;
    }
    await callback();
    const drift = Date.now() - expectedTime;
    expectedTime += interval;
    
    timeoutId = setTimeout(step, Math.max(0, interval - drift));
  }

  timeoutId = setTimeout(step, interval);

  return {
    stop() {
      stopped = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    },
    start() {
      if (stopped) {
        stopped = false;
        expectedTime = Date.now() + interval;
        timeoutId = setTimeout(step, interval);
      }
    },
  };
}

export function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}
