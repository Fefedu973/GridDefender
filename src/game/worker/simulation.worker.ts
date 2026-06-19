import { advanceSimulation } from "@/game/engine/simulation";
import type {
  SimulationWorkerRequest,
  SimulationWorkerResponse,
} from "@/game/worker/simulationWorkerProtocol";

interface SimulationWorkerScope {
  addEventListener: (
    type: "message",
    listener: (event: MessageEvent<SimulationWorkerRequest>) => void,
  ) => void;
  postMessage: (response: SimulationWorkerResponse) => void;
}

const workerScope = self as unknown as SimulationWorkerScope;

workerScope.addEventListener("message", (event: MessageEvent<SimulationWorkerRequest>) => {
  const request = event.data;
  if (request.type !== "advance") return;

  try {
    workerScope.postMessage({
      id: request.id,
      state: advanceSimulation(request.state),
      type: "advanced",
    } satisfies SimulationWorkerResponse);
  } catch (error) {
    workerScope.postMessage({
      id: request.id,
      message: error instanceof Error ? error.message : "Simulation worker failed",
      type: "error",
    } satisfies SimulationWorkerResponse);
  }
});

export {};
