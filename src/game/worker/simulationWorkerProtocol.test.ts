import assert from "node:assert/strict";
import test from "node:test";
import { isSimulationWorkerAdvanceResponse } from "@/game/worker/simulationWorkerProtocol";
import type { SimulationWorkerResponse } from "@/game/worker/simulationWorkerProtocol";

test("simulation worker protocol distinguishes advanced state responses from errors", () => {
  const success = { id: 1, state: {} as never, type: "advanced" } satisfies SimulationWorkerResponse;
  const failure = { id: 1, message: "boom", type: "error" } satisfies SimulationWorkerResponse;

  assert.equal(isSimulationWorkerAdvanceResponse(success), true);
  assert.equal(isSimulationWorkerAdvanceResponse(failure), false);
});
