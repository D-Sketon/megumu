import os from "os";
import { EventListener, sleep, type Listener } from "./utils";

type CpuTickMeta = {
  type: "TICK";
  sampleInterval?: number;
};

type CpuBasicMeta = {
  type: "LE" | "GE";
  duration: number;
  value: number | string;
  sampleInterval?: number;
  _triggeredTime?: number;
};

type CpuMeta = CpuBasicMeta | CpuTickMeta;

interface CpuInfo {
  idle: number;
  total: number;
}

class Cpu extends EventListener<CpuMeta> {
  addEventListener(
    meta: CpuMeta,
    callback: (meta: CpuInfo) => void,
    interval: number
  ): () => void;
  addEventListener(
    meta: CpuMeta,
    callback: Function,
    interval: number
  ): () => void {
    return super.addEventListener(meta, callback, interval);
  }

  callback(listener: Listener<CpuMeta>): void {
    const { type, sampleInterval = 1000 } = listener.meta;
    if (sampleInterval > listener.interval) {
      throw new Error("Sample interval cannot be greater than the interval");
    }
    if (type === "TICK") {
      this.measureCpuLoad().then((cpu) => {
        listener.callback(cpu);
      });
    } else {
      const { value } = listener.meta;
      let parsedValue: number = value as any;
      if (typeof value === "string") {
        if (value.endsWith("%")) {
          parsedValue = parseFloat(value) / 100;
        } else {
          parsedValue = parseFloat(value);
        }
      }
      this.measureCpuLoad(sampleInterval).then((cpu) => {
        const percentage = 1 - cpu.idle / cpu.total;
        if (type === "LE") {
          if (percentage <= parsedValue) {
            this.triggerCallback(listener as Listener<CpuBasicMeta>, cpu);
          }
        } else if (type === "GE") {
          if (percentage >= parsedValue) {
            this.triggerCallback(listener as Listener<CpuBasicMeta>, cpu);
          }
        }
      });
    }
  }

  private getCpuTimes(): CpuInfo {
    const cpus = os.cpus();
    let idle = 0,
      user = 0,
      nice = 0,
      sys = 0,
      irq = 0,
      total = 0;

    for (const cpu of cpus) {
      idle += cpu.times.idle;
      user += cpu.times.user;
      nice += cpu.times.nice;
      sys += cpu.times.sys;
      irq += cpu.times.irq;
    }

    total = idle + user + nice + sys + irq;

    return { idle, total };
  }

  private async measureCpuLoad(interval: number = 500): Promise<CpuInfo> {
    const start = this.getCpuTimes();
    await sleep(interval);
    const end = this.getCpuTimes();

    const idle = end.idle - start.idle;
    const total = end.total - start.total;

    return { idle, total };
  }

  private triggerCallback(listener: Listener<CpuBasicMeta>, cpu: CpuInfo) {
    const { _triggeredTime, duration } = listener.meta;
    const now = Date.now();
    if (_triggeredTime) {
      if (now - _triggeredTime >= duration) {
        listener.callback(cpu);
        listener.meta._triggeredTime = now;
      }
    } else {
      listener.meta._triggeredTime = now;
    }
  }
}

export default new Cpu();
