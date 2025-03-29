import { stableInterval } from "./timer";
import { parentPort } from "worker_threads";

export interface WorkerListener<T> {
  meta: T;
  intervalHandler?: ReturnType<typeof stableInterval>;
  interval: number;
  id: number;
}

export interface WorkerListenerResponse<T> {
  timestamp: number;
  data: T;
}

export abstract class WorkerEventListener<T> {
  protected listeners: Map<number, WorkerListener<T>> = new Map();

  addEventListener(id: number, meta: T, interval: number) {
    const listener: WorkerListener<T> = {
      id,
      meta,
      interval,
    };
    this.listeners.set(id, listener);
  }

  removeEventListener(id: number) {
    this.listeners.delete(id);
  }

  startInterval(id: number) {
    const listener = this.listeners.get(id);
    if (listener) {
      if (listener.intervalHandler) {
        listener.intervalHandler.start();
      } else {
        listener.intervalHandler = stableInterval(async () => {
          const data = await this.getData(listener);
          if (parentPort && data) {
            parentPort.postMessage({
              id: listener.id,
              data,
            });
          }
        }, listener.interval);
      }
    }
  }

  stopInterval(id: number) {
    const listener = this.listeners.get(id);
    if (listener && listener.intervalHandler) {
      listener.intervalHandler.stop();
    }
  }

  abstract getData(listener: WorkerListener<T>): any;

  destroy() {
    this.listeners.forEach((listener) => {
      this.stopInterval(listener.id);
    });
  }
}
