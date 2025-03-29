import { parentPort } from "worker_threads";
import { WorkerEventListener } from "./worker-event-listener";

export enum WorkerMessageType {
  ADD_LISTENER,
  REMOVE_LISTENER,
  START_INTERVAL,
  STOP_INTERVAL,
  DESTROY,
}

export const workerMessageRouter = (listener: WorkerEventListener<any>) => {
  parentPort?.on("message", (message) => {
    switch (message.type) {
      case WorkerMessageType.ADD_LISTENER: {
        const { id, meta, interval } = message;
        listener.addEventListener(id, meta, interval);
        break;
      }
      case WorkerMessageType.REMOVE_LISTENER: {
        const { id } = message;
        listener.removeEventListener(id);
        break;
      }
      case WorkerMessageType.START_INTERVAL: {
        const { id } = message;
        listener.startInterval(id);
        break;
      }
      case WorkerMessageType.STOP_INTERVAL: {
        const { id } = message;
        listener.stopInterval(id);
        break;
      }
      case WorkerMessageType.DESTROY: {
        listener.destroy();
        parentPort?.close();
        break;
      }
    }
  });
};
