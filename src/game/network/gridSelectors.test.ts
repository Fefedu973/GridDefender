import assert from "node:assert/strict";
import test from "node:test";
import {
  criticalConsumerUnservedMw,
  defaultNodeTargetForAction,
  effectNodeTargetForAction,
  hasTrippedCriticalConsumerFeeder,
  localActionsForNode,
} from "@/game/network/gridSelectors";
import type { GridNode, GridRuntime, TransmissionLine } from "@/game/network/networkTypes";
import type { AIJob, GameState } from "@/game/types";

function node(overrides: Partial<GridNode> & Pick<GridNode, "id" | "label" | "kind" | "role">): GridNode {
  return {
    region: "Test",
    lat: 0,
    lon: 0,
    position: [0, 0, 0],
    productionMw: 0,
    demandMw: 0,
    servedProductionMw: 0,
    servedDemandMw: 0,
    maxProductionMw: 0,
    maxDemandMw: 0,
    flexibilityMw: 0,
    criticality: "medium",
    status: "stable",
    connectedLineIds: [],
    aiWorkloadIds: [],
    description: "",
    ...overrides,
  };
}

function line(overrides: Partial<TransmissionLine> & Pick<TransmissionLine, "id" | "fromNodeId" | "toNodeId">): TransmissionLine {
  return {
    label: overrides.id,
    voltageKv: 225,
    nominalCapacityMw: 50,
    capacityMw: 50,
    signedFlowMw: 0,
    currentFlowMw: 0,
    utilizationRatio: 0,
    status: "stable",
    isControllable: true,
    isCritical: false,
    susceptance: 2,
    temperatureC: 20,
    overloadDuration: 0,
    utilizationHistory: [],
    tripped: false,
    protectionState: "closed",
    tripCount: 0,
    incidentIds: [],
    causes: [],
    actions: [],
    ...overrides,
  };
}

function state(grid: GridRuntime): Pick<GameState, "grid"> {
  return { grid };
}

test("default node targets are selected from runtime profiles, not legacy ids", () => {
  const runtime = state({
    nodes: [
      node({
        id: "custom-ev-zone",
        label: "Custom EV",
        kind: "ev",
        role: "consumer",
        maxDemandMw: 60,
        flexibilityMw: 40,
        runtime: { demand: { effectReductionAction: "smart_ev" } },
      }),
      node({
        id: "custom-storage",
        label: "Custom Battery",
        kind: "battery",
        role: "storage",
        maxProductionMw: 45,
        flexibilityMw: 45,
        runtime: { production: { effectAction: "discharge_battery" } },
      }),
      node({
        id: "custom-import",
        label: "Custom Import",
        kind: "interconnect",
        role: "connector",
        maxProductionMw: 80,
        runtime: { production: { effectAction: "import_energy" } },
      }),
      node({
        id: "custom-thermal",
        label: "Custom Thermal",
        kind: "nuclear",
        role: "producer",
        maxProductionMw: 70,
        runtime: { production: { effectAction: "thermal_backup" } },
      }),
      node({
        id: "custom-industry",
        label: "Custom Industry",
        kind: "industry",
        role: "consumer",
        maxDemandMw: 55,
        flexibilityMw: 25,
        runtime: { demand: { effectReductionAction: "curtail_industry" } },
      }),
    ],
    lines: [],
    unservedMw: 0,
    overloadMw: 0,
    trippedLineIds: [],
    maxUtilization: 0,
  });

  assert.deepEqual(defaultNodeTargetForAction(runtime, "smart_ev"), { kind: "node", id: "custom-ev-zone" });
  assert.deepEqual(defaultNodeTargetForAction(runtime, "discharge_battery"), { kind: "node", id: "custom-storage" });
  assert.deepEqual(defaultNodeTargetForAction(runtime, "import_energy"), { kind: "node", id: "custom-import" });
  assert.deepEqual(defaultNodeTargetForAction(runtime, "thermal_backup"), { kind: "node", id: "custom-thermal" });
  assert.deepEqual(defaultNodeTargetForAction(runtime, "curtail_industry"), { kind: "node", id: "custom-industry" });
  assert.deepEqual(effectNodeTargetForAction(runtime, "discharge_battery", { kind: "node", id: "custom-industry" }), {
    kind: "node",
    id: "custom-storage",
  });
  assert.deepEqual(effectNodeTargetForAction(runtime, "curtail_industry", { kind: "node", id: "custom-industry" }), {
    kind: "node",
    id: "custom-industry",
  });
});

test("critical service continuity is derived from critical consumers and feeders", () => {
  const runtime = state({
    nodes: [
      node({
        id: "custom-hospital",
        label: "Custom Hospital",
        kind: "hospital",
        role: "consumer",
        criticality: "critical",
        demandMw: 24,
        servedDemandMw: 18,
        maxDemandMw: 30,
      }),
      node({
        id: "custom-supply",
        label: "Custom Supply",
        kind: "nuclear",
        role: "producer",
        productionMw: 30,
        servedProductionMw: 24,
        maxProductionMw: 40,
      }),
    ],
    lines: [
      line({
        id: "custom-critical-feeder",
        fromNodeId: "custom-supply",
        toNodeId: "custom-hospital",
        isCritical: true,
        tripped: true,
      }),
    ],
    unservedMw: 6,
    overloadMw: 0,
    trippedLineIds: ["custom-critical-feeder"],
    maxUtilization: 0,
  });

  assert.equal(criticalConsumerUnservedMw(runtime), 6);
  assert.equal(hasTrippedCriticalConsumerFeeder(runtime), true);
});

test("local node actions come from runtime capabilities, not broad visual kinds", () => {
  const city = node({
    id: "plain-city",
    label: "Plain City",
    kind: "city",
    role: "consumer",
    maxDemandMw: 40,
  });
  const ev = node({
    id: "flex-ev",
    label: "Flex EV",
    kind: "ev",
    role: "consumer",
    maxDemandMw: 40,
    runtime: { demand: { effectReductionAction: "smart_ev" } },
  });
  const battery = node({
    id: "dispatchable-storage",
    label: "Dispatchable Storage",
    kind: "battery",
    role: "storage",
    maxProductionMw: 40,
    runtime: { production: { effectAction: "discharge_battery" } },
  });
  const datacenter = node({
    id: "edge-ai",
    label: "Edge AI",
    kind: "datacenter",
    role: "consumer",
    maxDemandMw: 40,
  });
  const agentJob: AIJob = {
    id: "agent-1",
    name: "Agent",
    kind: "agent",
    criticality: "medium",
    status: "active",
    basePowerMw: 12,
    currentPowerMw: 12,
    progress: 0,
    value: 10,
    startMinute: 0,
    deadlineMinute: 60,
    cached: false,
    modelScale: 1,
    timeoutApplied: false,
    loopRisk: 80,
    redundantCalls: 120,
    sovereign: true,
    assignedNodeId: "edge-ai",
    preferredNodeIds: ["edge-ai"],
    externalized: false,
    narrative: "",
  };

  assert.deepEqual(localActionsForNode(city), []);
  assert.deepEqual(localActionsForNode(ev), ["smart_ev"]);
  assert.deepEqual(localActionsForNode(battery), ["discharge_battery"]);
  assert.ok(localActionsForNode(datacenter).includes("migrate_ai"));
  assert.equal(localActionsForNode(datacenter).includes("agent_timeout"), false);
  assert.equal(localActionsForNode(datacenter, [agentJob]).includes("agent_timeout"), true);
});
