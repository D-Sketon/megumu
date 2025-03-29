import { Worker } from "worker_threads";
import { EventListener } from "../utils/event-listener";
import { MemoryCallback, MemoryMeta } from "./type";

class Memory extends EventListener<MemoryMeta> {
  constructor() {
    super();
    this.worker = new Worker(__dirname + "/worker.js");
    this.worker.on("message", (message) => {
      const { id } = message;
      const listener = this.listeners.get(id);
      if (listener) {
        listener.callback(message.data);
      }
    });
  }

  addEventListener<T extends MemoryMeta>(
    meta: T,
    callback: MemoryCallback<T>,
    interval: number
  ): () => void;
  addEventListener(
    meta: MemoryMeta,
    callback: Function,
    interval: number
  ): () => void {
    return super.addEventListener(meta, callback, interval);
  }
}

export default Memory;