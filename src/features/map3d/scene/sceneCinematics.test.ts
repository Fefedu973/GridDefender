import assert from "node:assert/strict";
import test from "node:test";
import type {
  FranceGridSnapshot,
  GridNode,
  TransmissionLine,
} from "@/game/network/networkTypes";
import { getSceneCinematicCue } from "@/features/map3d/scene/sceneCinematics";

function gridNode(id: string, position: [number, number, number], overrides: Partial<GridNode> = {}): GridNode {
  return {
    aiWorkloadIds: [],
    connectedLineIds: [],
    criticality: "medium",
    demandMw: 0,
    description: "",
    flexibilityMw: 0,
    id,
    kind: "city",
    label: id,
    lat: 0,
    lon: 0,
    maxDemandMw: 50,
    maxProductionMw: 0,
    position,
    productionMw: 0,
    region: "",
    role: "consumer",
    servedDemandMw: 0,
    servedProductionMw: 0,
    status: "stable",
    ...overrides,
  };
}

function gridLine(id: string, fromNodeId: string, toNodeId: string, overrides: Partial<TransmissionLine> = {}): TransmissionLine {
  return {
    actions: [],
    capacityMw: 100,
    causes: [],
    currentFlowMw: 40,
    emergencyCapacityUntil: undefined,
    fromNodeId,
    id,
    incidentIds: [],
    isControllable: true,
    isCritical: false,
    label: id,
    nominalCapacityMw: 100,
    overloadDuration: 0,
    signedFlowMw: 40,
    status: "stable",
    susceptance: 1,
    temperatureC: 45,
    toNodeId,
    tripped: false,
    protectionState: "closed",
    utilizationHistory: [],
    tripCount: 0,
    utilizationRatio: 0.4,
    voltageKv: 400,
    ...overrides,
  };
}

test("scene cinematic cue focuses tripped lines before softer incidents", () => {
  const snapshot: FranceGridSnapshot = {
    nodes: [
      gridNode("a", [0, 0, 0]),
      gridNode("b", [2, 0, 0]),
      gridNode("c", [5, 0, 0]),
    ],
    lines: [
      gridLine("warm-line", "a", "b", { status: "overloaded", utilizationRatio: 1.08 }),
      gridLine("tripped-line", "b", "c", { status: "offline", tripped: true }),
    ],
  };

  const cue = getSceneCinematicCue(snapshot);

  assert.equal(cue?.kind, "line");
  assert.equal(cue?.id, "tripped-line");
  assert.ok((cue?.shakeIntensity ?? 0) > 0.09);
});

test("scene cinematic cue falls back to unserved critical nodes", () => {
  const snapshot: FranceGridSnapshot = {
    nodes: [
      gridNode("hospital", [1, 0, 3], {
        criticality: "critical",
        demandMw: 30,
        kind: "hospital",
        servedDemandMw: 12,
        status: "critical",
      }),
    ],
    lines: [],
  };

  const cue = getSceneCinematicCue(snapshot);

  assert.equal(cue?.kind, "node");
  assert.equal(cue?.id, "hospital");
  assert.deepEqual(cue?.target, [1, 0.28, 3]);
});

test("scene cinematic cue is absent for stable fully served grids", () => {
  const snapshot: FranceGridSnapshot = {
    nodes: [gridNode("city", [0, 0, 0], { demandMw: 20, servedDemandMw: 20 })],
    lines: [],
  };

  assert.equal(getSceneCinematicCue(snapshot), undefined);
});
