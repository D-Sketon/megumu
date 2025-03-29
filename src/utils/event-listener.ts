import type { Worker } from "worker_threads";
import { WorkerMessageType } from "./worker-message";

export interface Listener {
  callback: Function;
  id: number;
}

export class EventListener<T> {
  protected listeners: Map<number, Listener> = new Map();
  protected isStarted: boolean = false;
  protected worker: Worker | null = null;
  protected id: number = 0;

  addEventListener(meta: T, callback: Function, interval: number) {
    const id = this.id;
    this.id++;
    const listener = {
      callback,
      id,
    };
    this.listeners.set(id, listener);
    if (this.worker) {
      this.worker.postMessage({
        type: WorkerMessageType.ADD_LISTENER,
        meta,
        id,
        interval,
      });
    }
    if (this.isStarted && this.worker) {
      this.worker.postMessage({
        type: WorkerMessageType.START_INTERVAL,
        id,
      });
    }
    return () => {
      this.removeEventListener(listener);
    };
  }

  private removeEventListener(listener: Listener) {
    this.listeners.delete(listener.id);
    if (this.worker) {
      this.worker.postMessage({
        type: WorkerMessageType.REMOVE_LISTENER,
        id: listener.id,
      });
    }
    if (this.isStarted && this.worker) {
      this.worker.postMessage({
        type: WorkerMessageType.STOP_INTERVAL,
        id: listener.id,
      });
    }
  }

  startSampling() {
    if (this.isStarted) {
      return;
    }
    this.isStarted = true;
    this.listeners.forEach((listener) => {
      if (this.worker) {
        this.worker.postMessage({
          type: WorkerMessageType.START_INTERVAL,
          id: listener.id,
        });
      }
    });
  }

  stopSampling() {
    if (!this.isStarted) {
      return;
    }
    this.isStarted = false;
    this.listeners.forEach((listener) => {
      if (this.worker) {
        this.worker.postMessage({
          type: WorkerMessageType.STOP_INTERVAL,
          id: listener.id,
        });
      }
    });
  }

  destroy() {
    if (this.worker) {
      this.worker.postMessage({
        type: WorkerMessageType.DESTROY,
      });
      this.worker = null;
    }
    this.listeners.clear();
  }
}
