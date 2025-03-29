import { WorkerListenerResponse } from "../utils/worker-event-listener";

export type MemoryTarget = "OS" | "RSS";

export type MemoryTickMeta = {
  target: MemoryTarget;
  type: "TICK";
};

export type MemoryBasicMeta = {
  target: MemoryTarget;
  type: "LE" | "GE";
  duration: number;
  value: number | string;
  _triggeredTime?: number;
};

export type OSMemory = { total: number; free: number };

export type MemoryMeta = MemoryBasicMeta | MemoryTickMeta;

export type MemoryCallback<T> = T extends { target: "OS" }
  ? (memory: WorkerListenerResponse<OSMemory>) => void
  : (memory: WorkerListenerResponse<number>) => void;
