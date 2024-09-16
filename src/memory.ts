import os from "os";
import { EventListener, type Listener } from "./utils";

type MemoryTarget =
  | "OS"
  | "RSS"
  | "HEAP_TOTAL"
  | "HEAP_USED"
  | "EXTERNAL"
  | "ARRAY_BUFFER";

type MemoryTickMeta = {
  target: MemoryTarget;
  type: "TICK";
};

type MemoryBasicMeta = {
  target: MemoryTarget;
  type: "LE" | "GE";
  duration: number;
  value: number | string;
  _triggeredTime?: number;
};

type MemoryMeta = MemoryBasicMeta | MemoryTickMeta;

type MemoryCallback<T> = T extends { target: "OS" }
  ? (memory: { total: number; free: number }) => void
  : (memory: number) => void;

class Memory extends EventListener<MemoryMeta> {
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

  callback(listener: Listener<MemoryMeta>): void {
    const { type, target } = listener.meta;
    const currentMemory = this.getMemory(target);
    if (type === "TICK") {
      listener.callback(currentMemory);
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
          this.triggerCallback(
            listener as Listener<MemoryBasicMeta>,
            currentMemory
          );
        }
      } else if (type === "GE") {
        if (parsedCurrentMemory > parsedTargetMemory) {
          this.triggerCallback(
            listener as Listener<MemoryBasicMeta>,
            currentMemory
          );
        }
      }
    }
  }

  private parseMemoryString(memory: string) {
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

  private getMemory(
    target: MemoryTarget
  ): number | { total: number; free: number } {
    const { rss, heapTotal, heapUsed, external, arrayBuffers } =
      process.memoryUsage();
    switch (target) {
      case "OS":
        return { total: os.totalmem(), free: os.freemem() };
      case "RSS":
        return rss;
      case "HEAP_TOTAL":
        return heapTotal;
      case "HEAP_USED":
        return heapUsed;
      case "EXTERNAL":
        return external;
      case "ARRAY_BUFFER":
        return arrayBuffers;
    }
  }

  private triggerCallback(
    listener: Listener<MemoryBasicMeta>,
    memory: number | { total: number; free: number }
  ) {
    const { _triggeredTime, duration } = listener.meta;
    const now = Date.now();
    if (_triggeredTime) {
      if (now - _triggeredTime >= duration) {
        listener.callback(memory);
        listener.meta._triggeredTime = now;
      }
    } else {
      listener.meta._triggeredTime = now;
    }
  }
}

export default new Memory();
