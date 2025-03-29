export type CpuTickMeta = {
  type: "TICK";
  sampleInterval?: number;
};

export type CpuBasicMeta = {
  type: "LE" | "GE";
  duration: number;
  value: number | string;
  sampleInterval?: number;
  _triggeredTime?: number;
};

export type CpuMeta = CpuBasicMeta | CpuTickMeta;

export interface CpuInfo {
  idle: number;
  total: number;
}
