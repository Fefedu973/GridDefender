import { advanceSimulation } from "@/game/engine/simulation";
import type { GameState } from "@/game/types";
import {
  isSimulationWorkerAdvanceResponse,
  type SimulationWorkerRequest,
  type SimulationWorkerResponse,
} from "@/game/worker/simulationWorkerProtocol";

interface PendingRequest {
  reject: (error: Error) => void;
  resolve: (state: GameState) => void;
}

let worker: Worker | undefined;
let workerUnavailable = false;
let nextRequestId = 1;
const pending = new Map<number, PendingRequest>();

function rejectPending(error: Error) {
  for (const request of pending.values()) request.reject(error);
  pending.clear();
}

function createWorker() {
  if (typeof Worker === "undefined" || workerUnavailable) return undefined;
  if (worker) return worker;

  try {
    worker = new Worker(new URL("./simulation.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<SimulationWorkerResponse>) => {
      const response = event.data;
      const request = pending.get(response.id);
      if (!request) return;
      pending.delete(response.id);

      if (isSimulationWorkerAdvanceResponse(response)) {
        request.resolve(response.state);
      } else {
        request.reject(new Error(response.message));
      }
    };
    worker.onerror = () => {
      workerUnavailable = true;
      worker?.terminate();
      worker = undefined;
      rejectPending(new Error("Simulation worker crashed"));
    };
    return worker;
  } catch {
    workerUnavailable = true;
    worker = undefined;
    return undefined;
  }
}

export function advanceSimulationAsync(state: GameState): Promise<GameState> {
  const simulationWorker = createWorker();
  if (!simulationWorker) {
    return Promise.resolve(advanceSimulation(state));
  }

  const id = nextRequestId;
  nextRequestId += 1;

  return new Promise((resolve, reject) => {
    pending.set(id, { reject, resolve });
    simulationWorker.postMessage({
      id,
      state,
      type: "advance",
    } satisfies SimulationWorkerRequest);
  });
}
