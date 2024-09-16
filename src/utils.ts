export function stableInterval(callback: () => void, interval: number) {
  let expectedTime = Date.now() + interval;
  let timeoutId : NodeJS.Timeout | null = null;
  let stopped = false;

  function step() {
    if (stopped) {
      return;
    }
    const drift = Date.now() - expectedTime;
    expectedTime += interval;
    callback();
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
    }
  }
}

export function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export abstract class EventListener<T> {
  private listeners: Array<Listener<T>> = [];
  private isStarted: boolean = false;

  addEventListener(meta: T, callback: Function, interval: number) {
    const listener = {
      meta,
      callback,
      interval,
    };
    this.listeners.push(listener);
    if (this.isStarted) {
      this.startInterval(listener);
    }
    return () => {
      this.removeEventListener(listener);
    };
  }

  private removeEventListener(listener: Listener<T>) {
    this.listeners = this.listeners.filter((item) => {
      return item !== listener;
    });
    if (this.isStarted) {
      this.stopInterval(listener);
    }
  }

  startSampling() {
    if (this.isStarted) {
      return;
    }
    this.isStarted = true;
    this.listeners.forEach((listener) => {
      this.startInterval(listener);
    });
  }

  stopSampling() {
    if (!this.isStarted) {
      return;
    }
    this.isStarted = false;
    this.listeners.forEach((listener) => {
      this.stopInterval(listener);
    });
  }

  private startInterval(listener: Listener<T>) {
    if (listener.intervalHandler) {
      listener.intervalHandler.start();
    } else {
      listener.intervalHandler = stableInterval(() => {
        this.callback(listener);
      }, listener.interval);
    }
  }

  private stopInterval(listener: Listener<T>) {
    if (listener.intervalHandler) {
      listener.intervalHandler.stop();
    }
  }

  abstract callback(listener: Listener<T>): void;

  destroy() {
    this.stopSampling();
    this.listeners = [];
  }
}

export interface Listener<T> {
  meta: T;
  callback: Function;
  interval: number;
  intervalHandler?: ReturnType<typeof stableInterval>;
}
