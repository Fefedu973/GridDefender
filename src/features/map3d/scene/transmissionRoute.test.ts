import assert from "node:assert/strict";
import test from "node:test";
import type {
  FranceGridSnapshot,
  GridNode,
  TransmissionLine,
} from "@/game/network/networkTypes";
import { collectTransmissionPylonPlacements } from "@/features/map3d/scene/TransmissionPylonInstances";
import { buildTransmissionRoute } from "@/features/map3d/scene/transmissionRoute";

function gridNode(id: string, position: [number, number, number]): GridNode {
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
    maxDemandMw: 0,
    maxProductionMw: 0,
    position,
    productionMw: 0,
    region: "",
    role: "consumer",
    servedDemandMw: 0,
    servedProductionMw: 0,
    status: "stable",
  };
}

function gridLine(overrides: Partial<TransmissionLine> = {}): TransmissionLine {
  return {
    actions: [],
    capacityMw: 100,
    causes: [],
    currentFlowMw: 52,
    emergencyCapacityUntil: undefined,
    fromNodeId: "west",
    id: "west-east",
    incidentIds: [],
    isControllable: true,
    isCritical: false,
    label: "west-east",
    nominalCapacityMw: 100,
    overloadDuration: 0,
    signedFlowMw: 52,
    status: "stable",
    susceptance: 1,
    temperatureC: 46,
    toNodeId: "east",
    tripped: false,
    protectionState: "closed",
    utilizationHistory: [],
    tripCount: 0,
    utilizationRatio: 0.52,
    voltageKv: 400,
    ...overrides,
  };
}

test("transmission routes omit pylons on very short spans and add them on long spans", () => {
  const shortRoute = buildTransmissionRoute({
    fromPosition: [0, 0, 0],
    toPosition: [0.6, 0, 0],
  });
  const longRoute = buildTransmissionRoute({
    fromPosition: [0, 0, 0],
    toPosition: [3, 0, 0],
  });

  assert.equal(shortRoute.pylons.length, 0);
  assert.equal(longRoute.pylons.length, 2);
  assert.equal(longRoute.wirePoints.length, 3);
});

test("transmission route visual bends separate overlapping lines laterally", () => {
  const straight = buildTransmissionRoute({
    fromPosition: [0, 0, 0],
    toPosition: [3, 0, 0],
  });
  const bent = buildTransmissionRoute({
    fromPosition: [0, 0, 0],
    toPosition: [3, 0, 0],
    visualBend: 0.45,
  });

  assert.equal(straight.points[17].z, 0);
  assert.ok(bent.points[17].z > 0.2);
});

test("transmission pylon placements are instancing-ready and inherit selected line color", () => {
  const snapshot: FranceGridSnapshot = {
    nodes: [gridNode("west", [0, 0, 0]), gridNode("east", [3, 0, 0])],
    lines: [gridLine()],
  };

  const placements = collectTransmissionPylonPlacements(snapshot, "west-east", "grid");

  assert.equal(placements.pylons.length, 2);
  assert.equal(placements.insulators.length, 6);
  assert.equal(placements.pylons[0].mastColor, "#39f6c0");
  assert.equal(placements.insulators[0].color, "#39f6c0");
});

test("safe render density reduces background pylons but keeps selected corridors detailed", () => {
  const snapshot: FranceGridSnapshot = {
    nodes: [gridNode("west", [0, 0, 0]), gridNode("east", [5, 0, 0])],
    lines: [gridLine()],
  };

  const high = collectTransmissionPylonPlacements(snapshot, undefined, "grid", { density: 1 });
  const safe = collectTransmissionPylonPlacements(snapshot, undefined, "grid", {
    density: 0.45,
    showInsulators: false,
  });
  const selected = collectTransmissionPylonPlacements(snapshot, "west-east", "grid", {
    density: 0.45,
    showInsulators: false,
  });

  assert.ok(high.pylons.length > safe.pylons.length);
  assert.equal(safe.insulators.length, 0);
  assert.equal(selected.pylons.length, high.pylons.length);
});
