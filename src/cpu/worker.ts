import { sleep } from "../utils/timer";
import {
  WorkerEventListener,
  WorkerListener,
  WorkerListenerResponse,
} from "../utils/worker-event-listener";
import { CpuBasicMeta, CpuInfo, CpuMeta } from "./types";
import os from "os";
import { workerMessageRouter } from "../utils/worker-message";

class CpuWorkerEventListener extends WorkerEventListener<CpuMeta> {
  constructor() {
    super();
  }

  async getData(
    listener: WorkerListener<CpuMeta>
  ): Promise<WorkerListenerResponse<CpuInfo> | void> {
    const timestamp = Date.now();
    const { type, sampleInterval = 1000 } = listener.meta;
    if (sampleInterval > listener.interval) {
      throw new Error("Sample interval cannot be greater than the interval");
    }
    if (type === "TICK") {
      const cpu = await this.measureCpuLoad();
      return {
        timestamp,
        data: cpu,
      };
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
      const cpuLoadMeasurement = await this.measureCpuLoad(sampleInterval);
      const percentage = 1 - cpuLoadMeasurement.idle / cpuLoadMeasurement.total;
      if (type === "LE") {
        if (percentage <= parsedValue) {
          return this.triggerCallback(
            listener as WorkerListener<CpuBasicMeta>,
            cpuLoadMeasurement,
            timestamp
          );
        }
      } else if (type === "GE") {
        if (percentage >= parsedValue) {
          return this.triggerCallback(
            listener as WorkerListener<CpuBasicMeta>,
            cpuLoadMeasurement,
            timestamp
          );
        }
      }
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

  private triggerCallback(
    listener: WorkerListener<CpuBasicMeta>,
    cpu: CpuInfo,
    timestamp: number
  ): WorkerListenerResponse<CpuInfo> | void {
    const { _triggeredTime, duration } = listener.meta;
    const now = Date.now();
    if (_triggeredTime) {
      if (now - _triggeredTime >= duration) {
        listener.meta._triggeredTime = now;
        return {
          timestamp,
          data: cpu,
        };
      }
    } else {
      listener.meta._triggeredTime = now;
    }
  }
}

workerMessageRouter(new CpuWorkerEventListener());
