import { Worker } from "worker_threads";
import { EventListener } from "../utils/event-listener";
import { CpuInfo, CpuMeta } from "./types";
import { WorkerListenerResponse } from "../utils/worker-event-listener";

class Cpu extends EventListener<CpuMeta> {
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
  addEventListener(
    meta: CpuMeta,
    callback: (meta: WorkerListenerResponse<CpuInfo>) => void,
    interval: number
  ): () => void;
  addEventListener(
    meta: CpuMeta,
    callback: Function,
    interval: number
  ): () => void {
    return super.addEventListener(meta, callback, interval);
  }
}

export default Cpu;
