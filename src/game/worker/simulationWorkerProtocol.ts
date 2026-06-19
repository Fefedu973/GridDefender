import type { GameState } from "@/game/types";

export interface SimulationWorkerAdvanceRequest {
  id: number;
  state: GameState;
  type: "advance";
}

export interface SimulationWorkerAdvanceResponse {
  id: number;
  state: GameState;
  type: "advanced";
}

export interface SimulationWorkerErrorResponse {
  id: number;
  message: string;
  type: "error";
}

export type SimulationWorkerRequest = SimulationWorkerAdvanceRequest;
export type SimulationWorkerResponse = SimulationWorkerAdvanceResponse | SimulationWorkerErrorResponse;

export function isSimulationWorkerAdvanceResponse(
  response: SimulationWorkerResponse,
): response is SimulationWorkerAdvanceResponse {
  return response.type === "advanced";
}
