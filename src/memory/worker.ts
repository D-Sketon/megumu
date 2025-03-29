import {
  WorkerEventListener,
  WorkerListener,
  WorkerListenerResponse,
} from "../utils/worker-event-listener";
import { workerMessageRouter } from "../utils/worker-message";
import { MemoryBasicMeta, MemoryMeta, MemoryTarget, OSMemory } from "./type";
import os from "os";

class MemoryWorkerEventListener extends WorkerEventListener<MemoryMeta> {
  constructor() {
    super();
  }

  getData(
    listener: WorkerListener<MemoryMeta>
  ): WorkerListenerResponse<number | OSMemory> | void {
    const timestamp = Date.now();
    const { type, target } = listener.meta;
    const currentMemory = this.getMemory(target);
    if (type === "TICK") {
      return {
        timestamp,
        data: currentMemory,
      };
    } else {
      const { value } = listener.meta;
      let parsedTargetMemory: number = value as any;

      let parsedCurrentMemory: number;
      if (target === "OS") {
        const { total, free } = currentMemory as {
          total: number;
          free: number;
        };
        parsedCurrentMemory = total - free;
        if (typeof value === "string") {
          if (value.endsWith("%")) {
            let percentage = parseInt(value.slice(0, -1));
            parsedTargetMemory = total * (percentage / 100);
          } else {
            parsedTargetMemory = this.parseMemoryString(value);
            if (parsedTargetMemory < 1) {
              parsedTargetMemory = total * parsedTargetMemory;
            }
          }
        }
      } else {
        parsedCurrentMemory = currentMemory as number;
        if (typeof value === "string") {
          if (value.endsWith("%")) {
            throw new Error("Only OS memory can be set in percentage");
          } else {
            parsedTargetMemory = this.parseMemoryString(value);
            if (parsedTargetMemory < 1) {
              throw new Error("Only OS memory can be set in percentage");
            }
          }
        }
      }
      if (type === "LE") {
        if (parsedCurrentMemory < parsedTargetMemory) {
          return this.triggerCallback(
            listener as WorkerListener<MemoryBasicMeta>,
            currentMemory,
            timestamp
          );
        }
      } else if (type === "GE") {
        if (parsedCurrentMemory > parsedTargetMemory) {
          return this.triggerCallback(
            listener as WorkerListener<MemoryBasicMeta>,
            currentMemory,
            timestamp
          );
        }
      }
    }
  }

  private parseMemoryString(memory: string): number {
    const unit = memory.slice(-2).toLowerCase();
    let value = parseFloat(memory);
    switch (unit) {
      case "tb":
        return value * 1024 * 1024 * 1024 * 1024;
      case "gb":
        return value * 1024 * 1024 * 1024;
      case "mb":
        return value * 1024 * 1024;
      case "kb":
        return value * 1024;
      default:
        return value;
    }
  }

  private getMemory(target: MemoryTarget): number | OSMemory {
    const { rss } = process.memoryUsage();
    switch (target) {
      case "OS":
        return { total: os.totalmem(), free: os.freemem() };
      case "RSS":
        return rss;
    }
  }

  private triggerCallback(
    listener: WorkerListener<MemoryBasicMeta>,
    memory: number | OSMemory,
    timestamp: number
  ): WorkerListenerResponse<number | OSMemory> | void {
    const { _triggeredTime, duration } = listener.meta;
    const now = Date.now();
    if (_triggeredTime) {
      if (now - _triggeredTime >= duration) {
        listener.meta._triggeredTime = now;
        return {
          timestamp,
          data: memory,
        };
      }
    } else {
      listener.meta._triggeredTime = now;
    }
  }
}

workerMessageRouter(new MemoryWorkerEventListener());
