<div align = center>
  <img src="https://fastly.jsdelivr.net/gh/D-Sketon/blog-img/megumu.png" width="128">
  <h1>megumu</h1>
  <h4>A simple way to monitor your operating system</h4>
</div>

The name "megumu" is from Iizunamaru Megumu(飯綱丸 龍), a character from Touhou.

## Installation

```bash
npm install megumu --save
```

## Usage

Simple example:

```javascript
import { Cpu, Memory } from "megumu";

const cpu = new Cpu();
const memory = new Memory();

// Get CPU usage
cpu.addEventListener(
  {
    type: "TICK",
  },
  (data) => {
    console.log(data.timestamp, data.data);
  },
  1000
);

cpu.startSampling();

// Get memory usage
memory.addEventListener(
  {
    type: "GE",
    target: "OS",
    value: "2GB",
    duration: 10000,
  },
  (data) => {
    // This callback is triggered only when the system memory usage is greater than 2GB and lasts for 10s
    console.log(data.timestamp, data.data);
  },
  1000
);

memory.startSampling();

// Stop sampling after 10s
setTimeout(() => {
  cpu.stopSampling();
  memory.stopSampling();

  // Stop the monitor and remove all event listeners
  cpu.destroy();
  memory.destroy();
}, 10000);
```

### API

#### Public API

Both `Cpu` and `Memory` instance have the same public API below:

##### `addEventListener`

```typescript
function addEventListener(
  meta: CpuMeta | MemoryMeta,
  callback: Function,
  interval: number
): () => void;
```

Add an event listener to the monitor, and return a function to remove the listener.

- `meta`: The meta data of the event listener, the specific type will be detailed below.
- `callback`: The callback function to be triggered when the event is fired, the specific type will be detailed below.
- `interval`: The interval of the monitor.

- `return`: A function to remove the listener.

##### `startSampling`

```typescript
function startSampling(): void;
```

Start the monitor.

##### `stopSampling`

```typescript
function stopSampling(): void;
```

Stop the monitor.

##### `destroy`

```typescript
function destroy(): void;
```

Stop the monitor and remove all event listeners.

#### CPU

```typescript
type CpuTickMeta = {
  type: "TICK"; // This type of meta will trigger the callback function every `interval`
  sampleInterval?: number; // The sample interval of the cpu usage, need to be less than the `interval`
};

type CpuBasicMeta = {
  type: "LE" | "GE"; // Whether the cpu usage is less than or greater than the value
  duration: number; // Only trigger the callback function when the cpu usage lasts for `duration`
  value: number | string; // e.g. 0.8, "80%"
  sampleInterval?: number; // The sample interval of the cpu usage, need to be less than the `interval`
};

type CpuMeta = CpuBasicMeta | CpuTickMeta;
```

##### Callback

```typescript
function addEventListener(
  meta: CpuMeta,
  callback: (meta: WorkerListenerResponse<CpuInfo>) => void,
  interval: number
): () => void;
```

#### Memory

```typescript
type MemoryTarget =
  | "OS" // The total memory of the operating system
  | "RSS"

type MemoryTickMeta = {
  target: MemoryTarget; // The target of the memory monitor
  type: "TICK"; // This type of meta will trigger the callback function every `interval`
};

type MemoryBasicMeta = {
  target: MemoryTarget; // The target of the memory monitor
  type: "LE" | "GE"; // Whether the memory usage is less than or greater than the value
  duration: number; // Only trigger the callback function when the memory usage lasts for `duration`
  value: number | string; // e.g. 0.8(only for OS type), "80%"(only for OS type), "2GB", "200MB"
};

type MemoryMeta = MemoryBasicMeta | MemoryTickMeta;
```

##### Callback

```typescript
type MemoryCallback<T> = T extends { target: "OS" }
  ? (memory: WorkerListenerResponse<{ total: number; free: number }>) => void
  : (memory: WorkerListenerResponse<number>) => void;

function addEventListener<T extends MemoryMeta>(
  meta: T,
  callback: MemoryCallback<T>,
  interval: number
): () => void;
```

## License

MIT
